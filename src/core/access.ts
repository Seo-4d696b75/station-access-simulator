import { copyDencoState, Denco, DencoState } from "./denco"
import { SkillPossess, Skill, refreshSkillState, ActiveSkill } from "./skill"
import { Random, Context, Logger, fixClock, getCurrentTime } from "./context"
import { LinkResult, LinksResult, Station, StationLink } from "./station"
import { FormationPosition, ReadonlyState, refreshEXPState, UserState } from "./user"


/**
 * アクセスにおけるスキルの評価ステップ
 * 
 * 以下の順序の各ステップでスキルを評価する
 * ただし、フットバース利用など特殊な状態で一部ステップはスキップされる場合あがある
 * 
 * - pink_check フットバース状態にするスキル
 * - probability_check スキル発動などに関わる確率の補正
 * - before_access アクセス開始前の処理（スキル無効化など）
 * - start_access アクセス結果に依らない処理（経験値付与など）
 * - damage_common ATK, DEF の増減
 * - damage_special ATK, DEF以外のダメージ計算
 * - damage_fixed 固定ダメージ値のセット
 * - after_damage ダメージ量やリンク成功などアクセス結果に依存する処理
 * 
 * 各ステップは攻撃側→守備側の順序で評価するため、
 * 1. 攻撃側の pink_check
 * 2. 守備側の pink_check
 * 3. 攻撃側の probability_check
 * 4. 守備側の probability_check
 * 5. .....
 * となる
 * 
 * 評価される対象スキルは以下の条件を満たすでんこのスキルを編成順に行われる
 * - スキルを保持している
 * - スキルがactive状態
 * - アクセス処理の途中で無効化スキルの影響を受けていない
 */
export type SkillEvaluationStep =
  "pink_check" |
  "probability_check" |
  "before_access" |
  "start_access" |
  "damage_common" |
  "damage_special" |
  "damage_fixed" |
  "after_damage"


/**
 * アクセス処理の入力・設定を定義します
 */
export interface AccessConfig {
  /**
   * 攻撃側の編成
   */
  offense: ReadonlyState<UserState & FormationPosition>
  /**
   * アクセス先の駅
   */
  station: Station
  /**
   * 守備側の編成
   */
  defense?: ReadonlyState<UserState & FormationPosition>
  /**
   * フットバースアイテム使用の有無を指定する
   */
  usePink?: boolean
}

export type AccessWho = AccessSide | "other"

/**
 * アクセス処理中の両編成の各でんこの状態
 */
export interface AccessDencoState extends DencoState {
  which: AccessSide
  who: AccessWho
  carIndex: number
  hpBefore: number
  hpAfter: number
  skillInvalidated: boolean
  reboot: boolean
}

export interface TriggeredSkill extends Denco {
  readonly step: SkillEvaluationStep
}

export interface DamageState {
  value: number
  attr: boolean
}

/**
 * アクセスの攻守ふたりの状態
 */
export interface AccessSideState {
  /**
   * 自身側の編成一覧
   */
  formation: AccessDencoState[]
  /**
   * 編成内における自身の位置
   */
  carIndex: number

  triggeredSkills: TriggeredSkill[]

  probabilityBoostPercent: number
  probabilityBoosted: boolean

  /**
   * アクセスによって発生したダメージ値
   * 攻撃側・フットバースの使用などによりダメージ計算自体が発生しない場合は `undefined`
   */
  damage?: DamageState

  score: number
  exp: number
}

export type AccessSide =
  "offense" |
  "defense"

export interface AccessState {
  time: number
  station: Station
  offense: AccessSideState
  defense?: AccessSideState

  depth: number

  damageBase?: number
  skipDamageFixed?: boolean
  damageFixed: number

  attackPercent: number
  defendPercent: number
  damageRatio: number

  linkSuccess: boolean
  linkDisconncted: boolean

  pinkMode: boolean
  pinkItemSet: boolean
  pinkItemUsed: boolean
}

function hasDefense(state: AccessState): state is AccessStateWithDefense {
  return !!state.defense
}

interface AccessStateWithDefense extends AccessState {
  defense: AccessSideState
}

function initAccessDencoState(context: Context, f: ReadonlyState<UserState & FormationPosition>, which: AccessSide): AccessSideState {
  const formation = refreshSkillState(context, f).formation.map((e, idx) => {
    const s: AccessDencoState = {
      ...e,
      hpBefore: e.currentHp,
      hpAfter: e.currentHp,
      which: which,
      who: idx === f.carIndex ? which : "other",
      carIndex: idx,
      reboot: false,
      skillInvalidated: false,
    }
    return s
  })
  return {
    carIndex: f.carIndex,
    formation: formation,
    triggeredSkills: [],
    probabilityBoostPercent: 0,
    probabilityBoosted: false,
    score: 0,
    exp: 0,
  }
}

export type AccessResult = {
  access: ReadonlyState<AccessState>
  offense: UserState & FormationPosition
  defense?: UserState & FormationPosition
}

export function startAccess(context: Context, config: AccessConfig): AccessResult {
  context = fixClock(context)
  const time = getCurrentTime(context)
  context.log.log(`アクセス処理の開始 ${new Date(time).toTimeString()}`)

  var state: AccessState = {
    time: time,
    station: config.station,
    offense: initAccessDencoState(context, config.offense, "offense"),
    defense: undefined,
    damageFixed: 0,
    attackPercent: 0,
    defendPercent: 0,
    damageRatio: 1.0,
    linkSuccess: false,
    linkDisconncted: false,
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
    state.defense = initAccessDencoState(context, config.defense, "defense")
    const d = getAccessDenco(state, "defense")
    var link = d.link.find(link => link.name === config.station.name)
    if (!link) {
      context.log.warn(`守備側(${d.name})のリンクに対象駅(${config.station.name})が含まれていません,追加します`)
      link = {
        ...config.station,
        start: getCurrentTime(context) - 100
      }
      d.link.push(link)
    }
  }


  state = execute(context, state)
  context.log.log("アクセス処理の終了")

  return completeAccess(context, config, copyAccessState(state))
}

export function copyAccessState(state: ReadonlyState<AccessState>): AccessState {
  return {
    time: state.time,
    station: state.station,
    attackPercent: state.attackPercent,
    defendPercent: state.defendPercent,
    damageFixed: state.damageFixed,
    damageRatio: state.damageRatio,
    damageBase: state.damageBase,
    skipDamageFixed: state.skipDamageFixed,
    pinkItemSet: state.pinkItemSet,
    pinkItemUsed: state.pinkItemUsed,
    pinkMode: state.pinkMode,
    linkSuccess: state.linkSuccess,
    linkDisconncted: state.linkDisconncted,
    offense: copySideState(state.offense),
    defense: state.defense ? copySideState(state.defense) : undefined,
    depth: state.depth,
  }
}

function copyAccessDencoState(state: ReadonlyState<AccessDencoState>): AccessDencoState {
  return {
    ...copyDencoState(state),
    which: state.which,
    who: state.who,
    carIndex: state.carIndex,
    hpBefore: state.hpBefore,
    hpAfter: state.hpAfter,
    reboot: state.reboot,
    skillInvalidated: state.skillInvalidated,
  }
}

function copySideState(state: ReadonlyState<AccessSideState>): AccessSideState {
  return {
    carIndex: state.carIndex,
    score: state.score,
    exp: state.exp,
    probabilityBoostPercent: state.probabilityBoostPercent,
    probabilityBoosted: state.probabilityBoosted,
    formation: Array.from(state.formation).map(d => copyAccessDencoState(d)),
    triggeredSkills: Array.from(state.triggeredSkills),
    damage: state.damage ? { ...state.damage } : undefined,
  }
}

function completeAccess(context: Context, config: AccessConfig, result: ReadonlyState<AccessState>): AccessResult {

  // このアクセスイベントの追加

  let offense: UserState & FormationPosition = {
    ...config.offense,
    formation: Array.from(result.offense.formation).map(d => copyDencoState(d)),
    event: [
      ...config.offense.event,
      {
        type: "access",
        data: {
          access: result,
          which: "offense"
        }
      },
    ]
  }
  let defense: UserState & FormationPosition | undefined = undefined
  if (result.defense && config.defense) {
    defense = {
      ...config.defense,
      formation: Array.from(result.defense.formation).map(d => copyDencoState(d)),
      event: [
        ...config.defense.event,
        {
          type: "access",
          data: {
            access: result,
            which: "defense"
          }
        },
      ]
    }
  }

  // アクセス直後のスキル発動イベント
  offense = checkSkillAfterAccess(context, offense, result, "offense")
  defense = defense ? checkSkillAfterAccess(context, defense, result, "defense") : undefined
  // リブートイベントの追加
  offense = checkReboot(context, offense, result, "offense")
  defense = defense ? checkReboot(context, defense, result, "defense") : undefined

  // レベルアップ処理
  offense = checkLevelup(context, offense, result)
  defense = defense ? checkLevelup(context, defense, result) : undefined

  return {
    ...context,
    offense: offense,
    defense: defense,
    access: result,
  }
}

function checkSkillAfterAccess(context: Context, state: UserState & FormationPosition, access: ReadonlyState<AccessState>, which: AccessSide): UserState & FormationPosition {
  const side = (which === "offense") ? access.offense : access.defense
  if (!side) return state
  filterActiveSkill(side.formation).forEach(idx => {
    const d = copyAccessDencoState(getFormation(access, which)[idx])
    const skill = d.skillHolder.skill
    const predicate = skill?.onAccessComplete
    if (skill && predicate) {
      const self = {
        ...d,
        skill: skill,
        skillPropertyReader: skill.propertyReader
      }
      const next = predicate(context, state, self, access)
      if (next) {
        state = {
          ...next,
          carIndex: state.carIndex,
        }
      }
    }
  })
  return state
}

function calcLinkResult(context: Context, link: StationLink, d: Denco): LinkResult {
  const time = getCurrentTime(context)
  let duration = time - link.start
  if (duration < 0) {
    context.log.error(`リンク時間が負数です ${duration}[ms] ${JSON.stringify(link)}`)
    throw Error("link duration < 0")
  }
  let attr = (link.attr === d.attr)
  let score = Math.floor(duration / 100)
  return {
    ...link,
    end: time,
    duration: duration,
    score: score,
    matchBonus: attr ? Math.floor(score * 0.3) : undefined
  }
}

function calcLinksResult(context: Context, links: StationLink[], d: ReadonlyState<DencoState>, which: AccessSide): LinksResult {
  const time = getCurrentTime(context)
  const linkResult = links.map(link => calcLinkResult(context, link, d))
  // TODO combo bonus の計算
  const linkScore = linkResult.map(link => link.score).reduce((a, b) => a + b, 0)
  const match = linkResult.map(link => link.matchBonus).filter(e => !!e) as number[]
  const matchBonus = match.reduce((a, b) => a + b, 0)
  const totalScore = linkScore + matchBonus
  // TODO 経験値の計算
  const exp = totalScore
  const result: LinksResult = {
    time: time,
    denco: copyDencoState(d),
    which: which,
    totalScore: totalScore,
    linkScore: linkScore,
    comboBonus: 0,
    matchBonus: matchBonus,
    matchCnt: match.length,
    exp: exp,
    link: linkResult,
  }
  return result
}

function checkReboot(context: Context, state: UserState & FormationPosition, access: ReadonlyState<AccessState>, which: AccessSide): UserState & FormationPosition {
  // access: こっちを弄るな！
  const side = (which === "offense") ? access.offense : access.defense
  if (!side) return state
  // 編成全員を確認する
  side.formation.forEach((dd, idx) => {
    if (dd.reboot) {
      const d = state.formation[idx]
      const result = calcLinksResult(context, d.link, d, which)
      // リンクEXPの追加
      d.currentExp += result.exp
      d.link = []
      state.event.push({
        type: "reboot",
        data: result,
      })
    }
  })
  return state
}

function checkLevelup(context: Context, state: UserState & FormationPosition, access: ReadonlyState<AccessState>): UserState & FormationPosition {
  return {
    ...refreshEXPState(context, state),
    carIndex: state.carIndex,
  }
}

function getDenco(state: AccessState, which: AccessSide): AccessDencoState {
  var s = which === "offense" ? state.offense : getDefense(state)
  return s.formation[s.carIndex]
}


export function getFormation<T>(state: { offense: { formation: T }, defense?: { formation: T } }, which: AccessSide): T {
  if (which === "offense") {
    return state.offense.formation
  } else {
    return getDefense(state).formation
  }
}

type AccessStateArg<T> = {
  offense: {
    carIndex: number
    formation: readonly T[]
  }
  defense?: {
    carIndex: number
    formation: readonly T[]
  }
}

export function getAccessDenco<T>(state: AccessStateArg<T>, which: AccessSide): T {
  if (which === "offense") {
    return state.offense.formation[state.offense.carIndex]
  } else {
    const f = getDefense(state)
    return f.formation[f.carIndex]
  }
}

export function getDefense<T>(state: { defense?: T }): T {
  const s = state.defense
  if (!s) {
    throw Error("守備側が見つかりません")
  }
  return s
}

function getDamage(state: AccessSideState): DamageState {
  const d = state.damage
  if (!d) {
    throw Error("no damage state found")
  }
  return d
}

function execute(context: Context, state: AccessState, top: boolean = true): AccessState {
  if (top) {
    // log active skill
    var names = state.offense.formation
      .filter(d => hasActiveSkill(d))
      .map(d => d.name)
      .join(",")
    context.log.log(`攻撃：${getDenco(state, "offense").name}`)
    context.log.log(`アクティブなスキル(攻撃側): ${names}`)

    if (hasDefense(state)) {
      const defense = getDefense(state)
      names = defense.formation
        .filter(d => hasActiveSkill(d))
        .map(d => d.name)
        .join(",")
      context.log.log(`守備：${getDenco(state, "defense").name}`)
      context.log.log(`アクティブなスキル(守備側): ${names}`)

    } else {
      context.log.log("守備側はいません")
    }

    // TODO アクセスによるスコアと経験値
    state.offense.exp += 100
    state.offense.score += 100

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
        state = evaluateSkillAt(context, state, "pink_check")
      }
    }
    if (state.pinkMode) context.log.log("フットバースが発動！")

    // 確率補正の可能性 とりあえず発動させて後で調整
    context.log.log("スキルを評価：確率ブーストの確認")
    state = evaluateSkillAt(context, state, "probability_check")
  }

  // 他ピンクに関係なく発動するもの
  context.log.log("スキルを評価：アクセス開始前")
  state = evaluateSkillAt(context, state, "before_access")
  context.log.log("スキルを評価：アクセス開始")
  state = evaluateSkillAt(context, state, "start_access")


  if (hasDefense(state) && !state.pinkMode) {
    context.log.log("攻守のダメージ計算を開始")

    // 属性ダメージの補正値
    const attrOffense = getDenco(state, "offense").attr
    const attrDefense = getDenco(state, "defense").attr
    const attr = (attrOffense === "cool" && attrDefense === "heat") ||
      (attrOffense === "heat" && attrDefense === "eco") ||
      (attrOffense === "eco" && attrDefense === "cool")
    if (attr) {
      state.damageRatio = 1.3
      context.log.log("攻守の属性によるダメージ補正が適用：1.3")
    } else {
      state.damageRatio = 1.0
    }

    // TODO filmによる増減の設定
    context.log.warn("フィルムによる補正をスキップ")

    // ダメージ増減の設定
    context.log.log("スキルを評価：ATK&DEFの増減")
    state = evaluateSkillAt(context, state, "damage_common")

    // 特殊なダメージの計算
    context.log.log("スキルを評価：特殊なダメージ計算")
    state = evaluateSkillAt(context, state, "damage_special")

    // 基本ダメージの計算
    if (!state.damageBase) {
      const base = getDenco(state, "offense").ap
      context.log.log(`基本ダメージを計算 AP:${base}`)
      state.damageBase = calcBaseDamage(context, state, base)
    }

    // 固定ダメージの計算
    if (state?.skipDamageFixed) {
      context.log.log("固定ダメージの計算：スキップ")
    } else {
      context.log.log("スキルを評価：固定ダメージ")
      state = evaluateSkillAt(context, state, "damage_fixed")
      context.log.log(`固定ダメージの計算：${state.damageFixed}`)
    }

    // 最終ダメージ計算 固定ダメージ等の影響でも負数にはならない
    const damageBase = state.damageBase
    if (!damageBase) {
      context.log.error("基本ダメージの値が見つかりません")
      throw Error("base damage not set")
    }
    let damage = Math.max(damageBase + state.damageFixed, 0)

    // 被アクセス側のダメージ確定
    const defense = getDefense(state)
    if (defense.damage) {
      // アクセスの繰り返しや反撃の影響でダメージ計算結果が既にある場合は加算
      damage += defense.damage.value
      defense.damage = {
        value: damage,
        attr: defense.damage.attr || (state.damageRatio !== 1.0)
      }
    } else {
      defense.damage = {
        value: damage,
        attr: state.damageRatio !== 1.0
      }
    }
    context.log.log(`ダメージ計算が終了：${damage}`)

    // HP0 になったらリブート
    const d = getAccessDenco(state, "defense")
    d.hpAfter = Math.max(d.hpBefore - damage, 0)
    d.reboot = damage >= d.hpBefore

    // 被アクセス側がリブートしたらリンク解除（ピンク除く）
    state.linkDisconncted = d.reboot

    // 被アクセス側がリンク解除、かつアクセス側がリブートしていない
    state.linkSuccess = state.linkDisconncted

    context.log.log(`守備の結果 HP: ${d.hpBefore} > ${d.hpAfter} reboot:${d.reboot}`)
  } else if (state.pinkMode) {
    // ピンク
    state.linkDisconncted = true
    state.linkSuccess = true

    // 守備側のアクセス駅のリンクのみ解除
    if (hasDefense(state)) {
      const d = getAccessDenco(state, "defense")
      const idx = d.link.findIndex(link => link.name === state.station.name)
      if (idx < 0) {
        context.log.error(`リンク解除した守備側のリンクが見つかりません ${state.station.name}`)
        throw Error("disconnected link not found")
      }
      // 特にイベントは発生せず経験値だけ追加
      const result = calcLinkResult(context, d.link[idx], d)
      state.defense.exp += result.score
      state.defense.score += result.score
      // リブートはないためcheckRebootでは反映されない
      d.link.splice(idx, 1)
    }
  } else {
    // 相手不在
    state.linkSuccess = true
  }

  context.log.log("アクセス結果を仮決定")
  context.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
  context.log.log(`守備側のリンク解除：${state.linkDisconncted}`)

  context.log.log("スキルを評価：ダメージ計算完了後")
  state = evaluateSkillAt(context, state, "after_damage")

  if (top) {
    context.log.log("最終的なアクセス結果を決定")
    // 最後に確率ブーストの有無を判定
    checkProbabilityBoost(state.offense)
    if (hasDefense(state)) {
      checkProbabilityBoost(state.defense)
    }

    // 最終的なリブート有無＆変化後のHPを計算
    completeDencoAccess(context, state, state.offense)
    if (hasDefense(state)) {
      completeDencoAccess(context, state, state.defense)
    }
    // アクセス中に発生したスコア＆経験値はこの段階で反映

    // 最終的なアクセス結果を計算 カウンターで変化する場合あり
    if (hasDefense(state) && !state.pinkMode) {
      let defense = getAccessDenco(state, "defense")
      state.linkDisconncted = defense.reboot
      let offense = getAccessDenco(state, "offense")
      state.linkSuccess = state.linkDisconncted && !offense.reboot
    }
    context.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
    context.log.log(`守備側のリンク解除：${state.linkDisconncted}`)

    // 守備側がリブートした場合はその駅のリンクのスコア＆経験値を表示
    if (hasDefense(state)) {
      const defense = getAccessDenco(state, "defense")
      if (defense.reboot) {
        const idx = defense.link.findIndex(l => l.name === state.station.name)
        if (idx < 0) {
          context.log.error(`リブートした守備側のリンクが見つかりません ${state.station.name}`)
          throw Error()
        }
        const result = calcLinkResult(context, defense.link[idx], defense)
        // DencoStateへのリンクスコア＆経験値の反映はcheckRebootでまとめて実行
        state.defense.exp += result.score
        state.defense.score += result.score
      }
    }

  }
  return state
}

function evaluateSkillAt(context: Context, state: AccessState, step: SkillEvaluationStep): AccessState {

  // 編成順に スキル発動有無の確認 > 発動による状態の更新 
  // ただしアクティブなスキルの確認は初めに一括で行う（同じステップで発動するスキル無効化は互いに影響しない）
  const offenseActive = filterActiveSkill(state.offense.formation)
  const defense = state.defense
  const defenseActive = defense ? filterActiveSkill(defense.formation) : undefined
  offenseActive.forEach(idx => {
    // 他スキルの発動で状態が変化する場合があるので毎度参照してからコピーする
    const d = copyAccessDencoState(state.offense.formation[idx])
    const skill = d.skillHolder.skill
    if (skill && (!state.pinkMode || skill.evaluateInPink)) {
      const active = {
        ...d,
        skill: skill,
        skillPropertyReader: skill.propertyReader,
      }
      // 状態に依存するスキル発動有無の判定は毎度行う
      if (canSkillEvaluated(context, state, step, active)) {
        markTriggerSkill(state.offense, step, d)
        context.log.log(`スキルが発動(攻撃側) name:${d.name}(${d.numbering}) skill:${skill.name}`)
        state = skill.evaluate ? skill.evaluate(context, state, step, active) : state
      }
    }
  })
  if (defense && defenseActive) {
    defenseActive.forEach(idx => {
      const d = copyAccessDencoState(defense.formation[idx])
      const skill = d.skillHolder.skill
      if (skill && (!state.pinkMode || skill.evaluateInPink)) {
        const active = {
          ...d,
          skill: skill,
          skillPropertyReader: skill.propertyReader,
        }
        if (canSkillEvaluated(context, state, step, active)) {
          markTriggerSkill(defense, step, d)
          context.log.log(`スキルが発動(守備側) name:${d.name}(${d.numbering}) skill:${skill.name}`)
          state = skill.evaluate ? skill.evaluate(context, state, step, active) : state
        }
      }
    })
  }
  return state
}

function markTriggerSkill(state: AccessSideState, step: SkillEvaluationStep, denco: Denco) {
  const list = state.triggeredSkills
  const idx = list.findIndex(d => d.numbering === denco.numbering)
  if (idx < 0) {
    list.push({
      ...denco,
      step: step
    })
  }
}

/**
 * 編成からアクティブなスキル（スキルの保有・スキル状態・スキル無効化の影響を考慮）を抽出する
 * @param list 
 * @param step 
 * @param which 
 * @returns 
 */
function filterActiveSkill(list: readonly ReadonlyState<AccessDencoState>[]): number[] {
  return list.filter(d => {
    const s = d.skillHolder
    return hasActiveSkill(d)
  }).map(d => d.carIndex)
}

/**
 * アクセス中のスキル無効化の影響も考慮してアクティブなスキルか判定
 * @param d 
 * @returns 
 */
function hasActiveSkill(d: ReadonlyState<AccessDencoState>): boolean {
  return isSkillActive(d.skillHolder) && !d.skillInvalidated
}

/**
 * スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
 * @param skill 
 * @returns 
 */
function isSkillActive(skill: SkillPossess): boolean {
  return skill.type === "possess" && skill.skill.state.type === "active"
}

/**
 * スキルのロジックと発動確率まで総合して発動有無を判定する
 * @param state 
 * @param d 発動する可能性があるアクティブなスキル
 * @returns 
 */
function canSkillEvaluated(context: Context, state: AccessState, step: SkillEvaluationStep, d: ReadonlyState<AccessDencoState & ActiveSkill>): boolean {
  const trigger = d.skill.canEvaluate ? d.skill.canEvaluate(context, state, step, d) : false
  if (typeof trigger === 'boolean') {
    return trigger
  }
  if (random(context, state, trigger, d.which)) {
    context.log.log(`スキルが発動できます ${d.name} 確率:${trigger}%`)
    return true
  } else {
    context.log.log(`スキルが発動しませんでした ${d.name} 確率:${trigger}%`)
    return false
  }
}

/**
 * 確率ブーストも考慮して確率を乱数を計算する
 * @param state ここの確率ブースト＆乱数器を使用する
 * @param percent 100分率で指定した確立でtrueを返す
 * @param which どっちサイドの確立ブーストを適用するか
 * @returns 
 */
export function random(context: Context, state: AccessState, percent: number, which: AccessSide): boolean {
  if (percent >= 100) return true
  const boost = which === "offense" ? state.offense.probabilityBoostPercent : state.defense?.probabilityBoostPercent
  if (!boost && boost !== 0) {
    context.log.error("存在しない守備側の確率補正計算を実行しようとしました")
    throw Error("defense not set, but try to read probability_boost_percent")
  }
  if (boost !== 0) {
    const defense = state.defense
    if (which === "offense") {
      state.offense.probabilityBoosted = true
    } else if (defense) {
      defense.probabilityBoosted = true
    }
  }
  if (context.random.mode === "force") {
    context.log.log("確率計算は無視されます mode: force")
    return true
  }
  if (context.random.mode === "ignore") {
    context.log.log("確率計算は無視されます mode: ignore")
    return false
  }
  return context.random() < (percent * (1.0 + boost / 100.0)) / 100.0
}

/**
 * 発動したものの影響がなかった確率ブーストのスキルを発動しなかったことにする
 * @param d 
 */
function checkProbabilityBoost(d: AccessSideState) {
  if (!d.probabilityBoosted && d.probabilityBoostPercent !== 0) {
    d.triggeredSkills = d.triggeredSkills.filter(s => s.step !== "probability_check")
  }
}

/**
 * 被アクセス側が受けるダメージ値のうち DAMAGE_COMMONまでに計算される基本値を参照
 * @param base APなど増減前のダメージ値
 * @param useAKT ATK増減を加味する
 * @param useDEF DEF増減を加味する
 * @param useAttr アクセス・被アクセス個体間の属性による倍率補正を加味する
 * @returns base * (100 + ATK - DEF)/100.0 * (attr_damage_ratio) = damage
 */
function calcBaseDamage(context: Context, state: AccessState, base: number, useAKT: boolean = true, useDEF: boolean = true, useAttr: boolean = true): number {
  let atk = 0
  let def = 0
  let ratio = 1.0
  if (useAKT) {
    atk = state.attackPercent
  }
  if (useDEF) {
    def = state.defendPercent
  }
  if (useAttr) {
    ratio = state.damageRatio
  }
  const damage = Math.floor(base * (100 + atk - def) / 100.0 * ratio)
  context.log.log(`基本ダメージを計算 ATK:${atk}% DEF:${def}% ${base} * ${100 + atk - def}% * ${ratio} = ${damage}`)
  return damage
}

/**
 * 攻守はそのままでアクセス処理を再度実行する
 * 
 * ダメージ計算・スコアと経験値の加算など各処理を再度実行して合計値を反映した新たな状態を返す
 */
export function repeatAccess(context: Context, state: ReadonlyState<AccessState>): AccessState {
  context.log.log(`アクセス処理を再度実行 #${state.depth + 1}`)
  const next: AccessState = {
    time: state.time,
    station: state.station,
    offense: copySideState(state.offense),
    defense: state.defense ? copySideState(state.defense) : undefined,
    damageFixed: 0,
    attackPercent: 0,
    defendPercent: 0,
    damageRatio: 1.0,
    linkSuccess: false,
    linkDisconncted: false,
    pinkMode: false,
    pinkItemSet: false,
    pinkItemUsed: false,
    depth: state.depth + 1,
  }
  const result = execute(context, next, false)
  context.log.log(`アクセス処理を終了 #${state.depth + 1}`)
  return result
}

/**
 * カウンター攻撃を処理する
 * 
 * 攻守を入れ替えて通常同様の処理を再度実行する
 * 
 * @param context 
 * @param state 現在の状態
 * @param denco カウンター攻撃の主体 現在の守備側である必要あり
 * @returns カウンター攻撃終了後の状態
 */
export function counterAttack(context: Context, current: ReadonlyState<AccessState>, denco: Denco): AccessState {
  const state = copyAccessState(current)
  // 面倒なので反撃は1回まで
  if (state.depth > 0) {
    context.log.warn("反撃は１回までだよ")
    return state
  }
  if (hasDefense(state)) {
    const idx = state.defense.formation.findIndex(d => d.numbering === denco.numbering)
    if (idx < 0) {
      context.log.error(`反撃するでんこが見つかりません ${denco.numbering} ${denco.name}`)
      return state
    }
    // 編成内の直接アクセスされた以外のでんこによる反撃の場合もあるため慎重に
    const offenseNextFormation = turnFromation(state.defense.formation, "defense", idx)
    const offenseNext: AccessSideState = {
      carIndex: idx,
      formation: offenseNextFormation,
      triggeredSkills: state.defense.triggeredSkills,
      probabilityBoostPercent: state.defense.probabilityBoostPercent,
      probabilityBoosted: state.defense.probabilityBoosted,
      score: 0,
      exp: 0,
    }
    // 原則さっきまでのoffense
    const defenseNextFormation = turnFromation(state.offense.formation, "offense", state.offense.carIndex)
    const defenseNext: AccessSideState = {
      ...state.offense,
      formation: defenseNextFormation,
      score: 0,
      exp: 0,
    }
    const next: AccessState = {
      time: state.time,
      station: state.station,
      offense: offenseNext,
      defense: defenseNext,
      damageFixed: 0,
      attackPercent: 0,
      defendPercent: 0,
      damageRatio: 1.0,
      linkSuccess: false,
      linkDisconncted: false,
      pinkMode: false,
      pinkItemSet: false,
      pinkItemUsed: false,
      depth: state.depth + 1,
    }

    // カウンター実行
    context.log.log("攻守交代、カウンター攻撃を開始")
    const result = execute(context, next, false)
    context.log.log("カウンター攻撃を終了")
    const offenseResult = result.offense
    const defenseResult = getDefense(result)

    // カウンターによるダメージ・Score・EXPの反映 AccessDencoState
    if (state.offense.damage) {
      context.log.error("攻撃側にダメージが発生しています")
    }
    state.offense.damage = defenseResult.damage
    // 被アクセス側であってもスキル等によりスコア＆EXPが加算される場合がある
    state.offense.exp += defenseResult.exp
    state.offense.score += defenseResult.score
    if (idx === state.defense.carIndex) {
      // 被アクセス側本人のカウンター攻撃
      const previous = getDamage(state.defense)
      const add = offenseResult.damage
      if (add) {
        // 二重反撃などでカウンター中にダメージを受ける場合
        state.defense.damage = {
          value: previous.value + add.value,
          attr: previous.attr || add.attr
        }
      }
      // カウンターは通常のアクセスと同様処理のためスコア＆EXPが加算される
      state.defense.score += offenseResult.score
      state.defense.exp += offenseResult.exp
    } else {
      // 被アクセス側本人以外のカウンター攻撃
      state.defense.score += offenseResult.score
      completeDencoAccess(context, result, offenseResult)
    }

    // カウンター攻撃によるでんこ状態の反映 AccessDencoState[]
    state.offense.formation = turnFromation(defenseResult.formation, "defense", state.offense.carIndex)
    state.defense.formation = turnFromation(offenseResult.formation, "offense", state.defense.carIndex)
  } else {
    context.log.error("相手が存在しないので反撃はできません")
  }
  return state
}

function turnFromation(formation: AccessDencoState[], currentSide: AccessSide, nextAccessIdx: number): AccessDencoState[] {
  const nextSide = currentSide === "defense" ? "offense" : "defense"
  return formation.map(s => {
    var next: AccessDencoState = {
      ...s,
      which: nextSide,
      who: s.carIndex === nextAccessIdx ? nextSide : "other",
    }
    return next
  })
}

function completeDencoAccess(context: Context, state: AccessState, s: AccessSideState) {
  const denco = s.formation[s.carIndex]
  // HPの反映
  if (s.damage) {
    const damage = s.damage.value
    denco.hpAfter = Math.max(denco.hpBefore - damage, 0)
  }
  // カウンターによりリブートする場合あり
  denco.reboot = denco.hpAfter === 0
  if (denco.reboot) {
    denco.currentHp = denco.maxHp
  } else {
    denco.currentHp = denco.hpAfter
  }
  // アクセスによる経験値付与
  denco.currentExp += s.exp

  context.log.log(`HP確定 ${denco.name} ${denco.hpBefore} > ${denco.hpAfter} reboot:${denco.reboot}`)
}