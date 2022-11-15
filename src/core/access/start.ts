import moment from "moment-timezone"
import { AccessDencoState, AccessResult, AccessSide, AccessSideState, AccessState, getAccessDenco, getDefense, hasActiveSkill, hasDefense } from "."
import { Context, withFixedClock } from "../context"
import { refreshSkillState } from "../skill/refresh"
import { copyState, ReadonlyState } from "../state"
import { Station } from "../station"
import { UserState } from "../user"
import { getUserPropertyReader } from "../user/property"
import { runAccessDamageCalculation } from "./damage"
import { completeDisplayScoreExp } from "./display"
import { completeDencoHP, updateDencoHP } from "./hp"
import { completeAccess } from "./result"
import { calcAccessScoreExp, calcLinkScoreExp } from "./score"
import { checkProbabilityBoost, filterActiveSkill, triggerSkillAt } from "./skill"

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
  context.log.log(`アクセス処理の開始 ${moment(time).format("YYYY-MM-DD HH:mm:ss.SSS")}`)

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
    context.log.warn(`攻撃側(${d.name})のリンクに対象駅(${config.station.name})が含まれています,削除します`)
    d.link = d.link.splice(idx, 1)
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
  const tmp = copyState<UserState>(f)
  refreshSkillState(context, tmp)
  const formation = tmp.formation.map((e, idx) => {
    const s: AccessDencoState = {
      ...e,
      hpBefore: e.currentHp,
      hpAfter: e.currentHp,
      which: which,
      who: idx === carIndex ? which : "other",
      carIndex: idx,
      reboot: false,
      skillInvalidated: false,
      damage: undefined,
      exp: {
        access: 0,
        skill: 0,
        link: 0,
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
      access: 0,
      skill: 0,
      link: 0,
    },
    displayedScore: 0,
    displayedExp: 0,
  }
}


function triggerSkillAfterDamage(context: Context, state: AccessState): AccessState {

  // アクティブなスキルを選択して追加
  let queue = filterActiveSkill(state)

  context.log.log("アクセス結果を仮決定")
  context.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
  context.log.log(`守備側のリンク解除：${state.linkDisconnected}`)

  context.log.log("スキルを評価：ダメージ計算完了後")

  while (true) {
    // スキル発動間のダメージを記録
    const offenseHP = state.offense.formation.map(d => d.hpAfter)
    const defenseHP = state.defense?.formation?.map(d => d.hpAfter) ?? []

    // スキル発動（必要なら）
    state = triggerSkillAt(context, state, "after_damage", queue)

    // HPの決定 & HP0 になったらリブート
    // 全員確認する
    updateDencoHP(context, state, "offense")
    updateDencoHP(context, state, "defense")

    // 再度スキル発動を確認する必要がある場合
    const message: string[] = []
    const next = queue.filter(e => {
      const side = (e.which === "offense") ? state.offense : getDefense(state)
      // スキルが既に発動済みならスキップ
      const hasTriggered = side.triggeredSkills.some(t => {
        return t.numbering === side.formation[e.carIndex].numbering
          && t.step === "after_damage"
      })
      if (hasTriggered) return false
      // ダメージ量に変化がない場合はスキップ
      const damageBuf = (e.which === "offense") ? offenseHP : defenseHP
      const previous = damageBuf[e.carIndex]
      const d = side.formation[e.carIndex]
      if (previous === d.hpAfter) return false

      message.push(`denco:${d.name} HP:${previous} => ${d.hpAfter}`)
      return true
    })
    if (next.length === 0) break

    context.log.log("スキルの評価中にHPが変化したでんこがいます")
    message.forEach(m => context.log.log(m))
    context.log.log("スキルを再度評価：ダメージ計算完了後")
    queue = next
  }

  return state
}

function logAccessStart(context: Context, state: ReadonlyState<AccessState>) {
  // log active skill
  var names = state.offense.formation
    .filter(d => hasActiveSkill(d))
    .map(d => d.name)
    .join(",")
  context.log.log(`攻撃：${getAccessDenco(state, "offense").name}`)
  context.log.log(`アクティブなスキル(攻撃側): ${names}`)

  if (state.defense) {
    const defense = getDefense(state)
    names = defense.formation
      .filter(d => hasActiveSkill(d))
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
  // アクセスによるスコアと経験値
  const [score, exp] = calcAccessScoreExp(context, state.offense, state.station)
  const accessDenco = getAccessDenco(state, "offense")
  accessDenco.exp.access += exp
  state.offense.score.access += score
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
    // リンク成功によるスコア＆経験値の付与
    const [score, exp] = calcLinkScoreExp(context, state.offense, state)
    const linkDenco = getAccessDenco(state, "offense")
    linkDenco.exp.access += exp
    state.offense.score.access += score
    context.log.log(`リンク成功による追加 ${linkDenco.name} score:${score} exp:${exp}`)
  }

  // 表示用の経験値＆スコアの計算
  completeDisplayScoreExp(context, state, "offense")
  completeDisplayScoreExp(context, state, "defense")
}
