import dayjs from "dayjs"
import { AccessDencoState, AccessResult, AccessSide, AccessSideState, AccessState, getAccessDenco, getDefense, getFormation, getSide, hasDefense } from "."
import { copy } from "../../"
import { Context, withFixedClock } from "../context"
import { TIME_FORMAT } from "../date"
import { refreshSkillState } from "../skill/refresh"
import { ReadonlyState } from "../state"
import { Station } from "../station"
import { UserState } from "../user"
import { getUserPropertyReader } from "../user/property"
import { runAccessDamageCalculation } from "./damage"
import { completeDencoHP, updateDencoHP } from "./hp"
import { completeAccess } from "./result"
import { calcAccessBonusScoreExp, calcLinkBonusScoreExp } from "./score"
import { checkProbabilityBoost, filterValidatedSkill, hasValidatedSkill, triggerSkillAt, triggerSkillOnSide } from "./skill"

/**
 * アクセス処理の入力・設定を定義します
 */
export interface AccessConfig {
  /**
   * 攻撃側の編成
   */
  offense: {
    state: ReadonlyState<UserState>
    carIndex: number
  }
  /**
   * アクセス先の駅
   */
  station: Station
  /**
   * 守備側の編成
   */
  defense?: {
    state: ReadonlyState<UserState>
    carIndex: number
  }
  /**
   * フットバースアイテム使用の有無を指定する
   */
  usePink?: boolean
}

export const startAccess = (context: Context, config: AccessConfig): AccessResult => withFixedClock(context, (time) => {
  context.log.log(`アクセス処理の開始 ${dayjs.tz(time).format(TIME_FORMAT)}`)

  var state: AccessState = {
    time: time.valueOf(),
    station: config.station,
    offense: initAccessDencoState(context, config.offense.state, config.offense.carIndex, "offense"),
    defense: undefined,
    damageFixed: 0,
    attackPercent: 0,
    defendPercent: 0,
    damageRatio: 1.0,
    linkSuccess: false,
    linkDisconnected: false,
    pinkMode: false,
    pinkItemSet: !!config.usePink,
    pinkItemUsed: false,
    depth: 0,
  }

  // アクセス駅とリンクの確認
  const d = getAccessDenco(state, "offense")
  const idx = d.link.findIndex(link => link.name === config.station.name)
  if (idx >= 0) {
    context.log.warn(`${d.name}のリンクにアクセス駅(${config.station.name})が既に含まれています`)
    // TODO 本来ならリンク済みの駅なら特別な対応が必要
    let s = d.link[idx]
    s.name = `${s.name}*`
  }
  if (config.defense) {
    state.defense = initAccessDencoState(context, config.defense.state, config.defense.carIndex, "defense")
    const d = getAccessDenco(state, "defense")
    var link = d.link.find(link => link.name === config.station.name)
    if (!link) {
      context.log.warn(`守備側(${d.name})のリンクに対象駅(${config.station.name})が含まれていません,追加します`)
      link = {
        ...config.station,
        start: context.currentTime.valueOf() - 100
      }
      d.link.push(link)
    }
  }


  logAccessStart(context, state)
  state = checkPink(context, state)
  state = runAccessStart(context, state)


  if (state.defense && !state.pinkMode) {
    state = runAccessDamageCalculation(context, state)
  } else if (state.pinkMode) {
    // ピンク
    state.linkDisconnected = true
    state.linkSuccess = true
  } else {
    // 相手不在
    state.linkSuccess = true
  }



  state = triggerSkillAfterDamage(context, state)

  decideLinkResult(context, state)


  context.log.log("アクセス処理の終了")

  return completeAccess(context, config, state)
})

function initAccessDencoState(context: Context, f: ReadonlyState<UserState>, carIndex: number, which: AccessSide): AccessSideState {
  const tmp = copy.UserState(f)
  refreshSkillState(context, tmp)
  const formation = tmp.formation.map((e, idx) => {
    const s: AccessDencoState = {
      ...e,
      levelBefore: e.level,
      maxHpBefore: e.maxHp,
      hpBefore: e.currentHp,
      hpAfter: e.currentHp,
      which: which,
      who: idx === carIndex ? which : "other",
      carIndex: idx,
      reboot: false,
      skillInvalidated: false,
      damage: undefined,
      exp: {
        access: {
          accessBonus: 0,
          damageBonus: 0,
          linkBonus: 0,
        },
        skill: 0,
        link: 0,
      },
      expPercent: {
        access: 0,
        accessBonus: 0,
        damageBonus: 0,
        linkBonus: 0,
        link: 0
      }
    }
    return s
  })
  const d = formation[carIndex]
  if (!d) {
    context.log.error(`対象のでんこが見つかりません side: ${which} carIndex: ${carIndex}, formation.length: ${formation.length}`)
  }
  return {
    user: getUserPropertyReader(f.user),
    carIndex: carIndex,
    formation: formation,
    triggeredSkills: [],
    probabilityBoostPercent: 0,
    probabilityBoosted: false,
    score: {
      access: {
        accessBonus: 0,
        damageBonus: 0,
        linkBonus: 0,
      },
      skill: 0,
      link: 0,
    },
    scorePercent: {
      access: 0,
      accessBonus: 0,
      damageBonus: 0,
      linkBonus: 0,
      link: 0
    },
  }
}

interface AfterDamageSkillEntry {
  carIndex: number,
  hp: number
}

function _triggerSkillAfterDamage(
  context: Context,
  state: AccessState,
  offenseQueue: AfterDamageSkillEntry[] | undefined,
  defenseQueue: AfterDamageSkillEntry[] | undefined,
  which: AccessSide,
): AccessState {
  // 終了条件
  // 攻撃・守備側ともに検査対象が0件
  if (offenseQueue?.length === 0 && defenseQueue?.length === 0) {
    return state
  }
  // 検査対象の選択
  let queue = which === "offense" ? offenseQueue : (
    // 相手不在の場合は検査対象は0件
    state.defense ? defenseQueue : []
  )
  // 検査対象の更新
  if (!queue) {
    const formation = getFormation(state, which)
    // 初期化（編成内全員を確認）
    queue = filterValidatedSkill(state, which).map(idx => ({
      carIndex: idx,
      hp: formation[idx].hpAfter,
    }))
  } else if (queue.length > 0) {
    const side = getSide(state, which)
    // 前回の発動判定時と比べて まだ発動していない＆HPの変化があった
    queue = queue.filter(e => {
      let self = side.formation[e.carIndex]
      let hasTriggered = side.triggeredSkills.some(t => t.numbering === self.numbering && t.step === "after_damage")
      let hpChanged = (e.hp !== self.hpAfter)
      return !hasTriggered && hpChanged
    }).map(e => ({
      ...e,
      hp: side.formation[e.carIndex].hpAfter
    }))
    if (queue.length > 0) {
      context.log.log("スキルの評価中にHPが変化したでんこがいます")
      queue = queue.map(e => {
        let self = side.formation[e.carIndex]
        context.log.log(`  denco:${self.name} HP:${e.hp} => ${self.hpAfter}`)
        return {
          carIndex: e.carIndex,
          hp: self.hpAfter
        }
      })
      context.log.log("スキルを再度評価：ダメージ計算完了後")
    }
  }
  // 検査
  if (queue.length > 0) {
    // スキル発動（必要なら）
    state = triggerSkillOnSide(
      context,
      state,
      "after_damage",
      which,
      queue.map(e => e.carIndex),
    )
    // HPの決定 & HP0 になったらリブート
    // 全員確認する
    updateDencoHP(context, state, "offense")
    updateDencoHP(context, state, "defense")
  }
  // 次の検査
  if (which === "offense") {
    return _triggerSkillAfterDamage(
      context,
      state,
      queue,
      defenseQueue,
      "defense"
    )
  } else {
    return _triggerSkillAfterDamage(
      context,
      state,
      offenseQueue,
      queue,
      "offense"
    )
  }
}

function triggerSkillAfterDamage(context: Context, state: AccessState): AccessState {

  context.log.log("アクセス結果を仮決定")
  context.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
  if (state.defense) {
    context.log.log(`守備側のリンク解除：${state.linkDisconnected}`)
  } else {
    context.log.log(`守備側のリンク解除：不在`)
  }

  context.log.log("スキルを評価：ダメージ計算完了後")

  return _triggerSkillAfterDamage(
    context,
    state,
    undefined,
    undefined,
    "offense"
  )
}

function logAccessStart(context: Context, state: ReadonlyState<AccessState>) {
  // log active skill
  var names = state.offense.formation
    .filter(d => hasValidatedSkill(d))
    .map(d => d.name)
    .join(",")
  context.log.log(`攻撃：${getAccessDenco(state, "offense").name}`)
  context.log.log(`アクティブなスキル(攻撃側): ${names}`)

  if (state.defense) {
    const defense = getDefense(state)
    names = defense.formation
      .filter(d => hasValidatedSkill(d))
      .map(d => d.name)
      .join(",")
    context.log.log(`守備：${getAccessDenco(state, "defense").name}`)
    context.log.log(`アクティブなスキル(守備側): ${names}`)

  } else {
    context.log.log("守備側はいません")
  }
}

function checkPink(context: Context, state: AccessState): AccessState {
  // pink_check
  // フットバの確認、アイテム優先=>スキル評価
  if (hasDefense(state)) {
    if (state.pinkItemSet) {
      state.pinkItemUsed = true
      state.pinkMode = true
      context.log.log("フットバースアイテムを使用")
    } else {
      // PROBABILITY_CHECK の前に評価する
      // 現状メロしか存在せずこの実装でもよいだろう
      context.log.log("スキルを評価：フットバースの確認")
      state = triggerSkillAt(context, state, "pink_check")
    }
  }
  if (state.pinkMode) context.log.log("フットバースが発動！")

  return state
}

/**
 * 守備側の有無・足湯有無に関わらず実行する処理
 */
function runAccessStart(context: Context, state: AccessState): AccessState {
  // フィルムの経験値補正
  applyFilmExpPercent(context, state, "offense")
  applyFilmExpPercent(context, state, "defense")

  // アクセスボーナスによるスコアと経験値
  const [score, exp] = calcAccessBonusScoreExp(context, state.offense, state.station)
  const accessDenco = getAccessDenco(state, "offense")
  accessDenco.exp.access.accessBonus += exp
  state.offense.score.access.accessBonus += score
  context.log.log(`アクセスによる追加 ${accessDenco.name} score:${score} exp:${exp}`)

  // 他ピンクに関係なく発動するスキル

  // 確率補正の可能性 とりあえず発動させて後で調整
  context.log.log("スキルを評価：確率ブーストの確認")
  state = triggerSkillAt(context, state, "probability_check")
  // 基本的に他スキルを無効化するスキル
  context.log.log("スキルを評価：アクセス開始前")
  state = triggerSkillAt(context, state, "before_access")
  // 経験値追加・スコア追加などのスキル
  context.log.log("スキルを評価：アクセス開始")
  state = triggerSkillAt(context, state, "start_access")

  return state
}

function decideLinkResult(context: Context, state: AccessState) {

  context.log.log("最終的なアクセス結果を決定")
  // 最後に確率ブーストの有無を判定
  checkProbabilityBoost(state.offense)
  if (state.defense) {
    checkProbabilityBoost(state.defense)
  }

  // 最終的なリブート有無＆変化後のHPを計算
  completeDencoHP(context, state, "offense")
  completeDencoHP(context, state, "defense")

  // 最終的なアクセス結果を計算 カウンターで変化する場合あり
  if (state.defense && !state.pinkMode) {
    let defense = getAccessDenco(state, "defense")
    state.linkDisconnected = defense.reboot
    let offense = getAccessDenco(state, "offense")
    state.linkSuccess = state.linkDisconnected && !offense.reboot
  }
  context.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
  context.log.log(`守備側のリンク解除：${state.linkDisconnected}`)

  if (state.linkSuccess) {
    // リンク成功ボーナスによるスコア＆経験値の付与
    const [score, exp] = calcLinkBonusScoreExp(context, state.offense, state)
    const linkDenco = getAccessDenco(state, "offense")
    linkDenco.exp.access.linkBonus += exp
    state.offense.score.access.linkBonus += score
    context.log.log(`リンク成功による追加 ${linkDenco.name} score:${score} exp:${exp}`)
  }
}

function applyFilmExpPercent(context: Context, state: AccessState, which: AccessSide) {
  const side = (which === "offense") ? state.offense : state.defense
  if (!side) return
  // アクセス・非アクセスのでんこのみ確認
  const d = side.formation[side.carIndex]
  const film = d.film
  if (film.type === "film" && film.expPercent) {
    // アクセスで獲得する経験値・リンク経験値両方に影響
    d.expPercent.access += film.expPercent
    d.expPercent.link += film.expPercent
  }
}
