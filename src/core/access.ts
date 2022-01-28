import { copyDencoState, Denco, DencoState } from "./denco"
import { SkillPossess, Skill, refreshSkillState, ActiveSkill } from "./skill"
import { Random, Context, Logger, fixClock, getCurrentTime } from "./context"
import { LinkResult, LinksResult, Station, StationLink } from "./station"
import { copyUserState, FormationPosition, ReadonlyState, refreshEXPState, User, UserState } from "./user"
import { Event } from "./event"


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

/**
 * アクセス中における各でんこの立ち位置を表す値
 * 
 * - "defense": アクセスを直接受けている（ただひとり、もしくは存在なし）
 * - "offense": アクセスを直接行っている（ただひとり）
 * - "other": "offense, defense"以外の編成内のでんこ
 */
export type AccessWho =
  "offense" |
  "defense" |
  "other"

/**
 * アクセス処理中の両編成の各でんこの状態
 */
export interface AccessDencoState extends DencoState {
  which: AccessSide
  who: AccessWho
  carIndex: number

  /**
   * アクセス開始時のHP
   */
  hpBefore: number

  /**
   * アクセス終了時のHP
   * 
   * `hpAfter === 0`の場合は`reboot === true`となり、
   * `currentHP`は最大HPにセットされる
   */
  hpAfter: number

  /**
   * アクセス処理中においてスキル無効化の影響によりこのでんこが保有するスキルが無効化されているか
   */
  skillInvalidated: boolean

  /**
   * このアクセスにおいてリブートしたか `hpAfter === 0`と必要十分
   */
  reboot: boolean

  /**
   * アクセスによって発生したダメージ値
   * 攻撃側・フットバースの使用などによりダメージ計算自体が発生しない場合は `undefined`
   * 
   * 通常はアクセス開始時の守備側のみダメージが発生するが、
   * 反撃などで初めの攻撃側や編成内他でんこにダメージが発生する場合もある
   */
  damage?: DamageState

  /**
   * このアクセス時に発生する経験値  
   * 
   * - アクセス開始時に付与される経験値
   * - リンク成功時に付与される経験値
   * - スキルによる経験値付与
   * - リブートした場合を除くリンク解除時の経験値付与
   * 
   * アクセスによってリブートしたリンクの経験値は含まない
   * 
   * 通常はアクセス開始時の攻守ふたりのみ経験値が付与されるが、
   * 反撃・スキルなど編成内他でんこに経験値が付与される場合もある
   */
  accessEXP: number
}

export interface AccessTriggeredSkill extends Denco {
  readonly step: SkillEvaluationStep
}

/**
 * アクセス中に発生したダメージ
 */
export interface DamageState {
  /**
   * ダメージの値（０以上の整数）
   */
  value: number
  /**
   * 属性によるダメージの増量補正が効いているか
   */
  attr: boolean
}

function addDamage(src: DamageState | undefined, damage: DamageState): DamageState {
  if (src) {
    return {
      value: src.value + damage.value,
      attr: src.attr || damage.attr
    }
  } else {
    return damage
  }
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

  /**
   * アクセス中に発動したスキル一覧
   */
  triggeredSkills: AccessTriggeredSkill[]

  probabilityBoostPercent: number
  probabilityBoosted: boolean

  /**
   * アクセス中に発生したスコア
   * 
   * アクセスによりリブートしたリンクのスコアは除くが、
   * リブート以外で解除したリンクスコアは含まれる
   */
  accessScore: number

  score: number
  exp: number
}

/**
 * アクセス中において攻撃・守備側のどちらの編成か判断する値
 */
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
      damage: undefined,
      accessEXP: 0,
    }
    return s
  })
  const d = formation[f.carIndex]
  if (!d) {
    context.log.error(`対象のでんこが見つかりません side: ${which} carIndex: ${f.carIndex}, formation.legth: ${formation.length}`)
  }
  return {
    carIndex: f.carIndex,
    formation: formation,
    triggeredSkills: [],
    probabilityBoostPercent: 0,
    probabilityBoosted: false,
    accessScore: 0,
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
    damage: state.damage ? { ...state.damage } : undefined,
    accessEXP: state.accessEXP,
  }
}

function copySideState(state: ReadonlyState<AccessSideState>): AccessSideState {
  return {
    carIndex: state.carIndex,
    accessScore: state.accessScore,
    probabilityBoostPercent: state.probabilityBoostPercent,
    probabilityBoosted: state.probabilityBoosted,
    formation: Array.from(state.formation).map(d => copyAccessDencoState(d)),
    triggeredSkills: Array.from(state.triggeredSkills),
    score: state.score,
    exp: state.exp,
  }
}

function completeAccess(context: Context, config: AccessConfig, access: ReadonlyState<AccessState>): AccessResult {


  // このアクセスイベントの追加

  let offense: UserState & FormationPosition = {
    ...copyUserState(config.offense),
    event: [
      ...config.offense.event,
      {
        type: "access",
        data: {
          access: access,
          which: "offense"
        }
      }
    ],
    carIndex: config.offense.carIndex,
  }
  offense = copyFromAccessState(context, offense, access, "offense")
  let defense: UserState & FormationPosition | undefined = undefined
  if (access.defense && config.defense) {
    defense = {
      ...copyUserState(config.defense),
      event: [
        ...config.defense.event,
        {
          type: "access",
          data: {
            access: access,
            which: "defense"
          }
        },
      ],
      carIndex: config.defense.carIndex,
    }
    defense = copyFromAccessState(context, defense, access, "defense")
  }

  let result: AccessResult = {
    offense: offense,
    defense: defense,
    access: access
  }


  // レベルアップ処理
  result = checkLevelup(context, result)

  // アクセス直後のスキル発動イベント
  result = checkSKillState(context, result)
  result.offense = checkSkillAfterAccess(context, result.offense, access, "offense")
  result.defense = result.defense ? checkSkillAfterAccess(context, result.defense, access, "defense") : undefined
  result = checkSKillState(context, result)

  return result
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

function copyFromAccessState(context: Context, state: UserState & FormationPosition, access: ReadonlyState<AccessState>, which: AccessSide): UserState & FormationPosition {
  const side = (which === "offense") ? access.offense : access.defense
  if (!side) return state
  // 編成全員を確認する
  const nextFormation = side.formation.map((d, idx) => {
    const next = copyDencoState(d)
    if (d.reboot) {
      if (d.link.length !== 0) {
        context.log.error("リンク解除処理の失敗")
      }
      const beforeAccess = state.formation[idx]
      const result = calcLinksResult(context, beforeAccess.link, d, which)
      next.currentExp += result.exp
      state.event.push({
        type: "reboot",
        data: result,
      })
    }
    return next
  })
  state.formation = nextFormation
  return state
}

function checkSKillState(context: Context, result: AccessResult): AccessResult {
  result.offense = {
    ...refreshSkillState(context, result.offense),
    carIndex: result.offense.carIndex,
  }
  if (result.defense){
    result.defense = {
      ...refreshSkillState(context, result.defense),
      carIndex: result.defense.carIndex,
    }
  }
  return result
}

function checkLevelup(context: Context, result: AccessResult): AccessResult{
  result.offense = {
    ...refreshEXPState(context, result.offense),
    carIndex: result.offense.carIndex,
  }
  if (result.defense){
    result.defense = {
      ...refreshEXPState(context, result.defense),
      carIndex: result.defense.carIndex,
    }
  }
  return result
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

  // TODO アクセスによるスコアと経験値
  getAccessDenco(state, "offense").accessEXP += 100
  state.offense.accessScore += 100

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
    const defense = getAccessDenco(state, "defense")
    const damageBase = state.damageBase
    if (!damageBase) {
      context.log.error("基本ダメージの値が見つかりません")
      throw Error("base damage not set")
    }
    const damage = addDamage(defense.damage, {
      value: Math.max(damageBase + state.damageFixed, 0),
      attr: state.damageRatio !== 1.0
    })
    context.log.log(`ダメージ計算が終了：${damage.value}`)

    // 攻守ふたりに関してアクセス結果を仮決定
    defense.damage = damage

    // HP0 になったらリブート
    defense.hpAfter = Math.max(defense.hpBefore - damage.value, 0)
    defense.reboot = damage.value >= defense.hpBefore

    // 被アクセス側がリブートしたらリンク解除（ピンク除く）
    state.linkDisconncted = defense.reboot

    // 被アクセス側がリンク解除、かつアクセス側がリブートしていない
    state.linkSuccess = state.linkDisconncted

    context.log.log(`守備の結果 HP: ${defense.hpBefore} > ${defense.hpAfter} reboot:${defense.reboot}`)
  } else if (state.pinkMode) {
    // ピンク
    state.linkDisconncted = true
    state.linkSuccess = true
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
    state = completeDencoHP(context, state, "offense")
    state = completeDencoHP(context, state, "defense")

    // 最終的なアクセス結果を計算 カウンターで変化する場合あり
    if (hasDefense(state) && !state.pinkMode) {
      let defense = getAccessDenco(state, "defense")
      state.linkDisconncted = defense.reboot
      let offense = getAccessDenco(state, "offense")
      state.linkSuccess = state.linkDisconncted && !offense.reboot
    }
    context.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
    context.log.log(`守備側のリンク解除：${state.linkDisconncted}`)

    // アクセスによる経験値の反映
    state = completeDencoAccessEXP(context, state, "offense")
    state = completeDencoAccessEXP(context, state, "defense")

    // 表示用の経験値＆スコアの計算
    state = completeDisplayScoreExp(context, state, "offense")
    state = completeDisplayScoreExp(context, state, "defense")

    // 各でんこのリンク状態を計算
    state = completeDencoLink(context, state, "offense")
    state = completeDencoLink(context, state, "defense")
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
 * 指定したでんこのスキルが発動済みか確認する
 * 
 * １度目のスキル発動における各コールバック呼び出しのタイミングでの返値の変化は次のとおり
 * - `Skill#canEvaluate` : `false`
 * - `Skill#evaluate` : `true`
 * @param state 
 * @param denco 
 * @param step `undefined`の場合は`denco`の一致でのみ検索する
 * @returns true if has been triggered
 */
export function hasSkillTriggered(state: ReadonlyState<AccessSideState>, denco: Denco, step?: SkillEvaluationStep): boolean {
  return state.triggeredSkills.findIndex(t => {
    return t.numbering === denco.numbering && (!step || step === t.step)
  }) >= 0
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
  let percent = Math.min(trigger, 100)
  percent = Math.max(percent, 0)
  if (percent >= 100) return true
  if (percent <= 0) return false
  // 上記までは確率に依存せず決定可能

  const boost = d.which === "offense" ? state.offense.probabilityBoostPercent : state.defense?.probabilityBoostPercent
  if (!boost && boost !== 0) {
    context.log.error("存在しない守備側の確率補正計算を実行しようとしました")
    throw Error("defense not set, but try to read probability_boost_percent")
  }
  if (boost !== 0) {
    const v = percent * (1 + boost / 100.0)
    context.log.log(`確率補正: +${boost}% ${percent}% > ${v}%`)
    percent = Math.min(v, 100)
  }
  if (random(context, percent)) {
    context.log.log(`スキルが発動できます ${d.name} 確率:${percent}%`)
    if (boost !== 0) {
      const defense = state.defense
      if (d.which === "offense") {
        state.offense.probabilityBoosted = true
      } else if (defense) {
        defense.probabilityBoosted = true
      }
    }
    return true
  } else {
    context.log.log(`スキルが発動しませんでした ${d.name} 確率:${percent}%`)
    return false
  }
}

/**
 * 確率ブーストも考慮して確率を乱数を計算する
 * @param percent 100分率で指定した確立でtrueを返す
 * @returns 
 */
export function random(context: Context, percent: number): boolean {
  if (percent >= 100) return true
  if (percent <= 0) return false
  if (context.random.mode === "force") {
    context.log.log("確率計算は無視されます mode: force")
    return true
  }
  if (context.random.mode === "ignore") {
    context.log.log("確率計算は無視されます mode: ignore")
    return false
  }
  return context.random() < percent / 100.0
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
    const next: AccessState = {
      time: state.time,
      station: state.station,
      // 編成内の直接アクセスされた以外のでんこによる反撃の場合もあるため慎重に
      offense: turnSide(state.defense, "defense", idx),
      // 原則さっきまでのoffense
      defense: turnSide(state.offense, "offense", state.offense.carIndex),
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
    if (!result.defense) {
      context.log.error(`カウンター攻撃の結果に守備側が見つかりません`)
      throw Error()
    }

    // カウンター攻撃によるでんこ状態の反映 AccessDencoState[]
    state.offense = turnSide(result.defense, "defense", state.offense.carIndex)
    state.defense = turnSide(result.offense, "offense", state.defense.carIndex)
  } else {
    context.log.error("相手が存在しないので反撃はできません")
  }
  return state
}

function turnSide(state: AccessSideState, currentSide: AccessSide, nextAccessIdx: number): AccessSideState {
  const nextSide = currentSide === "defense" ? "offense" : "defense"
  const nextFormation = state.formation.map(s => {
    var next: AccessDencoState = {
      ...s,
      which: nextSide,
      who: s.carIndex === nextAccessIdx ? nextSide : "other",
    }
    return next
  })
  return {
    carIndex: nextAccessIdx,
    formation: nextFormation,
    triggeredSkills: state.triggeredSkills,
    probabilityBoostPercent: state.probabilityBoostPercent,
    probabilityBoosted: state.probabilityBoosted,
    accessScore: state.accessScore,
    score: state.score,
    exp: state.exp,
  }
}

function completeDencoHP(context: Context, state: AccessState, which: AccessSide): AccessState {
  const side = which === "offense" ? state.offense : state.defense
  side?.formation?.forEach(d => {
    // HPの確定
    const damage = d.damage?.value ?? 0
    d.hpAfter = Math.max(d.hpBefore - damage, 0)
    // Reboot有無の確定
    d.reboot = (d.hpAfter === 0)
    if (d.reboot) {
      d.currentHp = d.maxHp
    } else {
      d.currentHp = d.hpAfter
    }
    if (d.who !== "other" || d.reboot || d.hpAfter !== d.hpBefore) {
      context.log.log(`HP確定 ${d.name} ${d.hpBefore} > ${d.hpAfter} reboot:${d.reboot}`)
    }
  })
  return state
}

function completeDencoLink(context: Context, state: AccessState, which: AccessSide): AccessState {
  const side = which === "offense" ? state.offense : state.defense
  side?.formation?.forEach(d => {
    // リンク追加・解除
    if (d.reboot) {
      // リブートは全リンク解除
      d.link = []
    } else if (d.who === "offense" && state.linkSuccess) {
      // 攻撃側のリンク成功
      d.link.push({
        ...state.station,
        start: getCurrentTime(context),
      })
    } else if (d.who === "defense" && state.linkDisconncted) {
      // 守備側のリンク解除 フットバースなどリブートを伴わない場合
      const idx = d.link.findIndex(link => link.name === state.station.name)
      if (idx < 0) {
        context.log.error(`リンク解除した守備側のリンクが見つかりません ${state.station.name}`)
        throw Error()
      }
      d.link.splice(idx, 1)
    }
  })
  return state
}


function completeDencoAccessEXP(context: Context, state: AccessState, which: AccessSide): AccessState {
  const side = which === "offense" ? state.offense : state.defense
  side?.formation?.forEach(d => {
    if (d.who === "defense" && state.linkDisconncted && !d.reboot) {
      // 守備側のリンク解除 フットバースなどリブートを伴わない場合
      const idx = d.link.findIndex(link => link.name === state.station.name)
      if (idx < 0) {
        context.log.error(`リンク解除した守備側のリンクが見つかりません ${state.station.name}`)
        throw Error()
      }
      // 特にイベントは発生せず経験値だけ追加
      const result = calcLinkResult(context, d.link[idx], d)
      // 例外的にリブートを伴わないリンク解除の場合は、リンクスコア＆経験値がアクセスのスコア＆経験値として加算
      d.accessEXP += result.score
      side.accessScore += result.score
    }
    // アクセスによる経験値付与
    if (d.who !== "other" || d.accessEXP !== 0) {
      context.log.log(`経験値追加 ${d.name} ${d.currentExp} + ${d.accessEXP}`)
    }
    d.currentExp += d.accessEXP
  })
  return state
}

function completeDisplayScoreExp(context: Context, state: AccessState, which: AccessSide): AccessState {
  const side = which === "offense" ? state.offense : state.defense
  if (side) {
    // 基本的には直接アクセスするでんこの経験値とスコア
    const d = side.formation[side.carIndex]
    side.score = side.accessScore
    side.exp = d.accessEXP
    // 守備側がリブートした場合はその駅のリンクのスコア＆経験値を表示
    if (d.reboot && d.who === "defense") {
      const idx = d.link.findIndex(l => l.name === state.station.name)
      if (idx < 0) {
        context.log.error(`リブートした守備側のリンクが見つかりません ${state.station.name}`)
        throw Error()
      }
      const result = calcLinkResult(context, d.link[idx], d)
      // アクセスの経験値として加算はするが、でんこ状態への反映はしない checkRebootLinksでまとめて加算
      side.score += result.score
      side.exp += result.score
    }
  }
  return state
}
