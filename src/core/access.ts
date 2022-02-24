import moment from "moment-timezone"
import { UserParam } from ".."
import { Context, fixClock, getCurrentTime } from "./context"
import { copyDencoState, Denco, DencoState } from "./denco"
import { ActiveSkill, refreshSkillState, SkillHolder } from "./skill"
import { LinkResult, LinksResult, Station, StationLink } from "./station"
import { copyUserParam, copyUserState, FormationPosition, ReadonlyState, refreshEXPState, UserState } from "./user"


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
export type AccessEvaluateStep =
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
  readonly which: AccessSide
  readonly who: AccessWho
  readonly carIndex: number

  /**
   * アクセス開始時のHP
   */
  readonly hpBefore: number

  /**
   * アクセス終了時のHP
   * 
   * `hpAfter === 0`の場合は`reboot === true`となり、
   * `currentHP`は最大HPにセットされる
   * 
   * **Note** アクセス完了までの値は未定義
   */
  hpAfter: number

  /**
   * アクセス処理中のHPの変化を直接指定する
   * 
   * このプロパティでHPを変化させるとダメージ量には加算されない  
   * ダメージ量に加算する場合は
   * - アクセス・被アクセスでんこ間のダメージ計算：{@link AccessState}の各種対応するプロパティ
   * - 直接ダメージを加算する：{@link damage}（まりか反撃スキルなど）
   * 
   * 初期値：アクセス開始時のHP {@link hpBefore}
   */
  currentHp: number

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
   * `access + skill`の合計値が経験値総量
   * 
   * - アクセス開始時に付与される経験値
   * - リンク成功時に付与される経験値
   * - スキルによる経験値付与
   * - リブートした場合を除くリンク解除時の経験値付与
   * 
   * **アクセスによってリブートしたリンクの経験値は含まない**
   * 
   * 通常はアクセス開始時の攻守ふたりのみ経験値が付与されるが、
   * 反撃・スキルなど編成内他でんこに経験値が付与される場合もある  
   * そのためスコアと異なり経験値はでんこ毎に計算される
   * see: {@link AccessState score}
   */
  exp: {
    /**
     * スキル以外の理由で加算される経験値
     */
    access: number
    /**
     * スキルの効果により加算される経験値  
     * **スキルによる経験値配布の対象外**
     */
    skill: number
  }

/**
 * アクセス終了後の状態
 * 
 * アクセス直後に発生した他のイベント  
 * - リブートによるリンクの解除・リンクスコア＆経験値の追加
 * - 経験値の追加によるレベルアップ
 * - アクセス直後に発動したスキル
 * による状態の変化も含まれる
 */
export interface AccessDencoResult extends AccessDencoState {
  /**
   * アクセスによってリブートしたリンク
   * 
   * リブート（{@link AccessDencoState reboot} === true）した場合は解除したすべてのリンク結果、  
   * リブートを伴わないフットバースの場合は解除したひとつのリンク結果
   */
  disconnetedLink?: LinksResult

  /**
   * 現在のHP
   */
  currentHp: number
}

/**
 * スコアの計算方法を定義します
 * 
 * スコアの値を元に経験値も計算されます
 */
export interface ScorePredicate {
  /**
   * アクセス開始時にアクセス側が取得するスコアを計算
   * 
   * アクセス相手ユーザ・でんこやリンク成功可否などに依存しない
   * @param state アクセスする本人を含む編成の現在の状態
   * @param station アクセスする駅
   */
  calcAccessScore: (context: Context, state: ReadonlyState<AccessSideState>, station: Station) => number

  /**
   * アクセス側がリンク成功時に取得するスコアを計算  
   * @param state アクセスする本人を含む編成の現在の状態
   * @param access アクセスの状態
   */
  calcLinkSuccessScore: (context: Context, state: ReadonlyState<AccessSideState>, access: ReadonlyState<AccessState>) => number

  /**
   * アクセス側が与えたダメージ量に応じたスコアを計算
   */
  calcDamageScore: (context: Context, damage: number) => number
  /**
   * リンク保持によるスコアを計算
   * 
   * コンボボーナス・属性ボーナスの値は含まずリンクによる基本スコア値のみ計算する
   */
  calcLinkScore: (context: Context, link: StationLink) => number
}

const DEFAULT_SCORE_PREDICATE: ScorePredicate = {
  calcAccessScore: (context, state, station) => 100,
  calcLinkSuccessScore: (context, state, access) => 100,
  calcDamageScore: (context, damage) => Math.floor(damage),
  calcLinkScore: (context, link) => Math.floor((getCurrentTime(context) - link.start) / 100)
}

export interface AccessTriggeredSkill extends Denco {
  readonly step: AccessEvaluateStep
}

/**
 * アクセス中に各でんこに発生したダメージ
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
  user: UserParam
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
   * 
   * でんこ毎に計算される経験値と異なりスコアはユーザ単位で計算される
   */
  score: number

  /**
   * アクセス表示用のスコア値
   * 
   * アクセスで発生したスコア{@link score} + 守備側でリブートした場合のその駅のリンクスコア
   */
  displayedScore: number

  /**
   * アクセス表示用の経験値値
   * 
   * 直接アクセス・被アクセスするでんこがアクセス中に得た経験値{@link } + 守備側でリブートした場合のその駅のリンク経験値
   */
  displayedExp: number
}

/**
 * アクセス時の攻守各側の詳細と結果
 */
export interface AccessUserResult extends AccessSideState, UserState {
  formation: AccessDencoResult[]
}

/**
 * アクセス中において攻撃・守備側のどちらの編成か判断する値
 */
export type AccessSide =
  "offense" |
  "defense"

/**
 * 被アクセス側のダメージ計算の状態
 * 
 * `damage_common`, `damage_special`の段階まで考慮して計算する
 * 
 * 固定ダメージの値は{@link AccessState damageFixed}
 */
export interface DamageCalcState {
  /**
   * `damage_fixed`以降の段階において増減する値 
   * 
   * **非負数** 最終てきなダメージ計算において固定ダメージ{@link AccessState damageFixed}の影響で負数になる場合は0に固定される
   */
  variable: number
  /**
   * `damage_fixed`以降の段階においても増減しない値 **非負数**
   * 
   * 固定ダメージ{@link AccessState damageFixed}の影響を受けず最終的なダメージ量にそのまま加算される
   */
  constant: number
}

export interface AccessState {
  time: number
  station: Station
  offense: AccessSideState
  defense?: AccessSideState

  depth: number

  /**
   * `damage_common`の段階までにおける被アクセス側のダメージ計算量
   * 
   * `variable + constant`の合計値が計算されたダメージ量
   * 
   * `damage_common, damage_special`のスキル評価後のタイミングで原則次のように計算され値がセットされる  
   * - AP: 攻撃側のAP
   * - ATK,DEF: ダメージ計算時の増減値% {@link attackPercent} {@link defendPercent}  
   * `variable = AP * (100 + ATK - DEF)/100.0 * damageRation, constant = 0`
   * 
   * `damage_fixed`で計算する固定ダメージ値はここには含まれない
   * 個体ダメージもスキップする場合は {@link skipDamageFixed}
   * 
   * ただし`damage_special`のスキル発動による特殊な計算など、
   * `damage_special`の段階までにこの`damageBase`の値が`undefined`以外にセットされた場合は
   * 上記の計算はスキップされる
   */
  damageBase?: DamageCalcState

  /**
   * 固定値で加減算されるダメージ値
   */
  damageFixed: number

  /**
   * `damage_common`の段階までに評価された`ATK`累積値 単位：%
   */
  attackPercent: number

  /**
   * `damage_common`の段階までに評価された`DEF`累積値 単位：%
   */
  defendPercent: number

  /**
   * `damage_common`の直後に計算される基本ダメージにおける倍率
   * 
   * 現状ではでんこ属性による`1.3`の倍率のみ発生する
   */
  damageRatio: number

  linkSuccess: boolean
  linkDisconncted: boolean

  pinkMode: boolean
  pinkItemSet: boolean
  pinkItemUsed: boolean
}

/**
 * アクセスの結果
 * 
 * アクセスによって更新された攻守両側の状態は`offense, defense`を参照すること
 */
export interface AccessResult extends AccessState {
  offense: AccessUserResult
  defense?: AccessUserResult
}

function hasDefense(state: AccessState): state is AccessStateWithDefense {
  return !!state.defense
}

interface AccessStateWithDefense extends AccessState {
  defense: AccessSideState
}

function initAccessDencoState(context: Context, f: ReadonlyState<UserState>, carIndex: number, which: AccessSide): AccessSideState {
  const tmp = copyUserState(f)
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
        skill: 0
      }
    }
    return s
  })
  const d = formation[carIndex]
  if (!d) {
    context.log.error(`対象のでんこが見つかりません side: ${which} carIndex: ${carIndex}, formation.legth: ${formation.length}`)
  }
  return {
    user: copyUserParam(f.user),
    carIndex: carIndex,
    formation: formation,
    triggeredSkills: [],
    probabilityBoostPercent: 0,
    probabilityBoosted: false,
    score: 0,
    displayedScore: 0,
    displayedExp: 0,
  }
}

export function startAccess(context: Context, config: AccessConfig): AccessResult {
  context = fixClock(context)
  const time = getCurrentTime(context)
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
    state.defense = initAccessDencoState(context, config.defense.state, config.defense.carIndex, "defense")
    const d = getAccessDenco(state, "defense")
    var link = d.link.find(link => link.name === config.station.name)
    if (!link) {
      context.log.warn(`守備側(${d.name})のリンクに対象駅(${config.station.name})が含まれていません,追加します`)
      link = {
        ...config.station,
        start: getCurrentTime(context).valueOf() - 100
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
    pinkItemSet: state.pinkItemSet,
    pinkItemUsed: state.pinkItemUsed,
    pinkMode: state.pinkMode,
    linkSuccess: state.linkSuccess,
    linkDisconncted: state.linkDisconncted,
    offense: copyAccessSideState(state.offense),
    defense: state.defense ? copyAccessSideState(state.defense) : undefined,
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
    exp: { ...state.exp },
  }
}

function copyAccessDencoResult(state: ReadonlyState<AccessDencoResult>): AccessDencoResult {
  return {
    ...copyAccessDencoState(state),
    disconnetedLink: state.disconnetedLink
  }
}

export function copyAccessSideState(state: ReadonlyState<AccessSideState>): AccessSideState {
  return {
    user: copyUserParam(state.user),
    carIndex: state.carIndex,
    score: { ...state.score },
    probabilityBoostPercent: state.probabilityBoostPercent,
    probabilityBoosted: state.probabilityBoosted,
    formation: Array.from(state.formation).map(d => copyAccessDencoState(d)),
    triggeredSkills: Array.from(state.triggeredSkills),
    displayedScore: state.displayedScore,
    displayedExp: state.displayedExp,
  }
}

export function copyAccessUserResult(state: ReadonlyState<AccessUserResult>): AccessUserResult {
  return {
    ...copyUserState(state),
    carIndex: state.carIndex,
    score: state.score,
    probabilityBoostPercent: state.probabilityBoostPercent,
    probabilityBoosted: state.probabilityBoosted,
    formation: state.formation.map(d => copyAccessDencoResult(d)),
    triggeredSkills: Array.from(state.triggeredSkills),
    displayedScore: state.displayedScore,
    displayedExp: state.displayedExp,
        }
      }
    ],
    carIndex: config.offense.carIndex,
  }
  offense = copyFromAccessState(context, offense, access, "offense")
  let defense: UserState & FormationPosition | undefined = undefined
  if (access.defense && config.defense) {
    defense = {
      ...copyUserState(config.defense.state),
      event: [
        ...config.defense.state.event,
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
    // スキル発動による状態変更を考慮して評価直前にコピー
    const d = copyAccessDencoState(getFormation(access, which)[idx])
    const skill = d.skill
    if (skill.type !== "possess") {
      context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${d.name} possess => ${skill.type}`)
      throw Error()
    }
    const predicate = skill?.onAccessComplete
    if (skill && predicate) {
      const self = {
        ...d,
        skill: skill,
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

function calcLinkResult(context: Context, link: StationLink, d: Denco, idx: number): LinkResult {
  const time = getCurrentTime(context)
  const duration = time - link.start
  if (duration < 0) {
    context.log.error(`リンク時間が負数です ${duration}[ms] ${JSON.stringify(link)}`)
  }
  const predicate = context.scorePredicate?.calcLinkScore ?? DEFAULT_SCORE_PREDICATE.calcLinkScore
  const score = predicate(context, link)
  const attr = (link.attr === d.attr)
  const ratio = (idx < LINK_COMBO_RATIO.length) ?
    LINK_COMBO_RATIO[idx] : LINK_COMBO_RATIO[LINK_COMBO_RATIO.length - 1]
  const match = attr ? Math.floor(score * 0.15) : 0
  const combo = Math.floor(score * (ratio - 1))
  return {
    ...link,
    end: time,
    duration: duration,
    linkScore: score,
    matchAttr: attr,
    matchBonus: match,
    comboBonus: combo,
    totatlScore: score + match + combo,
  }
}

const LINK_COMBO_RATIO = [
  1.0, 1.1, 1.2, 1.3, 1.4,
  1.6, 1, 7, 1.9, 2.1, 2.3,
  2.5, 2.8, 3.1, 3.4, 3.7,
  4.1, 4.5, 5.0, 5.5, 6.1,
  6.7, 7.4, 8.1, 8.9, 9.8,
  10.8, 11.9, 13.1, 14.4, 15.8,
  17.4, 19.1, 20.0
]

function calcLinksResult(context: Context, links: StationLink[], d: ReadonlyState<DencoState>, which: AccessSide): LinksResult {
  const time = getCurrentTime(context).valueOf()
  const linkResult = links.map((link, idx) => calcLinkResult(context, link, d, idx))
  const linkScore = linkResult.map(link => link.linkScore).reduce((a, b) => a + b, 0)
  const match = linkResult.filter(link => link.matchAttr)
  const matchBonus = match.map(link => link.matchBonus).reduce((a, b) => a + b, 0)
  const comboBonus = linkResult.map(link => link.comboBonus).reduce((a, b) => a + b, 0)
  const totalScore = linkScore + matchBonus + comboBonus
  const exp = calcExp(totalScore)
  const result: LinksResult = {
    time: time,
    denco: copyDencoState(d),
    which: which,
    totalScore: totalScore,
    linkScore: linkScore,
    comboBonus: comboBonus,
    matchBonus: matchBonus,
    matchCnt: match.length,
    exp: exp,
    link: linkResult,
  }
  return result
}

function calcExp(score: number): number {
  // TODO 経験値増加の加味
  return score
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
  if (result.defense) {
    result.defense = {
      ...refreshSkillState(context, result.defense),
      carIndex: result.defense.carIndex,
    }
  }
  return result
}

function checkLevelup(context: Context, result: AccessResult): AccessResult {
  result.offense = {
    ...refreshEXPState(context, result.offense),
    carIndex: result.offense.carIndex,
  }
  if (result.defense) {
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

/**
 * アクセスにおける編成（攻撃・守備側）を取得する
 * @param state アクセス状態 {@link AccessState}
 * @param which 攻撃側・守備側のどちらか指定する
 * @throws 存在しない守備側を指定した場合はErrorを投げる
 * @returns `AccessDencoState[]`
 */
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

/**
 * アクセスにおいて直接アクセスする・アクセスを受けるでんこを取得する
 * @param state アクセス状態 {@link AccessState}
 * @param which 攻撃側・守備側のどちらか指定
 * @throws 存在しない守備側を指定した場合Error
 * @returns {@link AccessDencoState}
 */
export function getAccessDenco<T>(state: AccessStateArg<T>, which: AccessSide): T {
  if (which === "offense") {
    return state.offense.formation[state.offense.carIndex]
  } else {
    const f = getDefense(state)
    return f.formation[f.carIndex]
  }
}

/**
 * アクセスの守備側の状態を取得する
 * @param state 
 * @returns {@link AccessSideState}
 * @throws 守備側が存在しない場合はError
 */
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


    // アクセスによるスコアと経験値
    const predicate = context.scorePredicate?.calcAccessScore ?? DEFAULT_SCORE_PREDICATE.calcAccessScore
    const score = predicate(context, state.offense, state.station)
    const exp = calcExp(score)
    const accessDenco = getAccessDenco(state, "offense")
    accessDenco.exp.access += exp
    state.offense.score += score
    context.log.log(`アクセスによる追加 ${accessDenco.name} score:${score} exp:${exp}`)

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
      state.damageBase = {
        variable: calcBaseDamage(context, state),
        constant: 0
      }
    }

    // 固定ダメージの計算
    context.log.log("スキルを評価：固定ダメージ")
    state = evaluateSkillAt(context, state, "damage_fixed")
    context.log.log(`固定ダメージの計算：${state.damageFixed}`)

    // 最終ダメージ計算 固定ダメージ等の影響でも負数にはならない
    const defense = getAccessDenco(state, "defense")
    const damageBase = state.damageBase
    if (!damageBase) {
      context.log.error("基本ダメージの値が見つかりません")
      throw Error("base damage not set")
    }
    if (damageBase.variable < 0 || damageBase.constant < 0) {
      context.log.error(`基本ダメージの値は非負である必要があります ${JSON.stringify(damageBase)}`)
    }
    const damage = {
      // 固定ダメージで負数にはせず0以上に固定 & 確保されたダメージ量を加算
      value: Math.max(damageBase.variable + state.damageFixed, 0) + damageBase.constant,
      attr: state.damageRatio !== 1.0
    }
    // ダメージ量に応じたスコア＆経験値の追加
    const predicate = context.scorePredicate?.calcDamageScore ?? DEFAULT_SCORE_PREDICATE.calcDamageScore
    const score = predicate(context, damage.value)
    const exp = calcExp(score)
    const accessDenco = getAccessDenco(state, "offense")
    accessDenco.exp.access += exp
    state.offense.score += score
    context.log.log(`ダメージ量による追加 ${accessDenco.name} score:${score} exp:${exp}`)
    // 反撃など複数回のダメージ計算が発生する場合はそのまま加算
    const damageSum = addDamage(defense.damage, damage)
    context.log.log(`ダメージ計算が終了：${damageSum.value}`)

    // 攻守ふたりに関してアクセス結果を仮決定
    defense.damage = damageSum

    // HPの決定 & HP0 になったらリブート
    updateDencoHP(context, defense)

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

    if (state.linkSuccess) {
      // リンク成功によるスコア＆経験値の付与
      const predicate = context.scorePredicate?.calcLinkSuccessScore ?? DEFAULT_SCORE_PREDICATE.calcLinkSuccessScore
      const score = predicate(context, state.offense, state)
      const exp = calcExp(score)
      const linkDenco = getAccessDenco(state, "offense")
      linkDenco.exp.access += exp
      state.offense.score += score
      context.log.log(`リンク成功による追加 ${linkDenco.name} score:${score} exp:${exp}`)
    }

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

function evaluateSkillAt(context: Context, state: AccessState, step: AccessEvaluateStep): AccessState {

  // 編成順に スキル発動有無の確認 > 発動による状態の更新 
  // ただしアクティブなスキルの確認は初めに一括で行う（同じステップで発動するスキル無効化は互いに影響しない）
  const offenseActive = filterActiveSkill(state.offense.formation)
  const defense = state.defense
  const defenseActive = defense ? filterActiveSkill(defense.formation) : undefined
  offenseActive.forEach(idx => {
    // 他スキルの発動で状態が変化する場合があるので毎度参照してからコピーする
    const d = copyAccessDencoState(state.offense.formation[idx])
    const skill = d.skill
    if (skill.type !== "possess") {
      context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${d.name} possess => ${skill.type}`)
      throw Error()
    }
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
      const skill = d.skill
      if (skill.type !== "possess") {
        context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${d.name} possess => ${skill.type}`)
        throw Error()
      }
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

function markTriggerSkill(state: AccessSideState, step: AccessEvaluateStep, denco: Denco) {
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
export function hasSkillTriggered(state: ReadonlyState<AccessSideState> | undefined, denco: Denco, step?: AccessEvaluateStep): boolean {
  if (!state) return false
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
    return hasActiveSkill(d)
  }).map(d => d.carIndex)
}

/**
 * アクセス中のスキル無効化の影響も考慮してアクティブなスキルか判定
 * @param d 
 * @returns 
 */
function hasActiveSkill(d: ReadonlyState<AccessDencoState>): boolean {
  return isSkillActive(d.skill) && !d.skillInvalidated
}

/**
 * スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
 * @param skill 
 * @returns 
 */
function isSkillActive(skill: SkillHolder): boolean {
  return skill.type === "possess" && skill.state.type === "active"
}

/**
 * スキルのロジックと発動確率まで総合して発動有無を判定する
 * @param state 
 * @param d 発動する可能性があるアクティブなスキル
 * @returns 
 */
function canSkillEvaluated(context: Context, state: AccessState, step: AccessEvaluateStep, d: ReadonlyState<AccessDencoState & ActiveSkill>): boolean {
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
    // 発動の如何を問わず確率補正のスキルは発動した扱いになる
    const defense = state.defense
    if (d.which === "offense") {
      state.offense.probabilityBoosted = true
    } else if (defense) {
      defense.probabilityBoosted = true
    }
  }
  if (random(context, percent)) {
    context.log.log(`スキルが発動できます ${d.name} 確率:${percent}%`)
    return true
  } else {
    context.log.log(`スキルが発動しませんでした ${d.name} 確率:${percent}%`)
    return false
  }
}

/**
 * 確率計算モードを考慮してtrue/falseの条件を計算する  
 * 
 * {@link RandomMode} の値に応じて乱数計算を無視してtrue/falseを返す場合もある  
 * 計算の詳細  
 * 1. `percent <= 0` -> `false`
 * 2. `percent >= 100` -> `true`
 * 3. `context.random.mode === "ignore"` -> `false`
 * 4. `context.random.mode === "force"` -> `true`
 * 5. `context.random.mode === "normal"` -> 疑似乱数を用いて`percent`%の確率で`true`を返す
 * @param percent 100分率で指定した確率でtrueを返す
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
 * 被アクセス側が受けるダメージ値のうち`damage_common`までに計算される基本値を参照
 * 
 * - `state.damageBase`が定義済みの場合はその値を返す  
 * - 未定義の場合は {@link calcBaseDamage}で計算して返す  
 */
export function getBaseDamage(context: Context, state: ReadonlyState<AccessState>, useAKT: boolean = true, useDEF: boolean = true, useAttr: boolean = true): DamageCalcState {
  if (state.damageBase) {
    return state.damageBase
  }
  return {
    variable: calcBaseDamage(context, state),
    constant: 0,
  }
}


/**
 * 被アクセス側が受けるダメージ値のうち`damage_common`までに計算される基本値を計算
 * 
 * `AP * (100 + ATK - DEF)/100.0 * (damageRatio)`
 * 
 * @param useAKT ATK増減を加味する default:`true`
 * @param useDEF DEF増減を加味する default:`true`
 * @param useAttr アクセス・被アクセス個体間の属性による倍率補正を加味する default:`true`
 * @returns 
 */
export function calcBaseDamage(context: Context, state: ReadonlyState<AccessState>, useAKT: boolean = true, useDEF: boolean = true, useAttr: boolean = true): number {
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
  const base = getAccessDenco(state, "offense").ap
  // ATK&DEF合計が0%未満になってもダメージ値は負数にはしない
  const damage = Math.max(1, Math.floor(base * (100 + atk - def) / 100.0 * ratio))
  context.log.log(`基本ダメージを計算 AP:${base} ATK:${atk}% DEF:${def}% DamageBase:${damage} = ${base} * ${100 + atk - def}% * ${ratio}`)
  return damage
}

/**
 * 攻守はそのままでアクセス処理を再度実行する
 * 
 * @param state 現在のアクセス状態
 * @returns ダメージ計算・スコアと経験値の加算など各処理を再度実行して合計値を反映した新たな状態を返す
 */
export function repeatAccess(context: Context, state: ReadonlyState<AccessState>): AccessState {
  context.log.log(`アクセス処理を再度実行 #${state.depth + 1}`)
  const next: AccessState = {
    time: state.time,
    station: state.station,
    offense: copyAccessSideState(state.offense),
    defense: state.defense ? copyAccessSideState(state.defense) : undefined,
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
    user: state.user,
    carIndex: nextAccessIdx,
    formation: nextFormation,
    triggeredSkills: state.triggeredSkills,
    probabilityBoostPercent: state.probabilityBoostPercent,
    probabilityBoosted: state.probabilityBoosted,
    score: state.score,
    displayedScore: state.displayedScore,
    displayedExp: state.displayedExp,
  }
}

function completeDencoHP(context: Context, state: AccessState, which: AccessSide): AccessState {
  const side = which === "offense" ? state.offense : state.defense
  side?.formation?.forEach(d => {
    updateDencoHP(context, d)
    // 新しい状態のHPを決定
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

/**
 * hpAfter = max{0, hpCurrecnt(default:hpBefore) - damage(if any)}
 * reboot = (hpAfter === 0)
 * @param context 
 * @param d 
 */
function updateDencoHP(context: Context, d: AccessDencoState) {
  // HPの決定
  const damage = d.damage?.value ?? 0
  if (d.hpBefore !== d.currentHp) {
    context.log.log(`ダメージ計算以外でHPが変化しています ${d.name} ${d.hpBefore} > ${d.currentHp}`)
    if (d.currentHp < 0 || d.maxHp <= d.currentHp) {
      context.log.error(`現在のHPの値が不正です range[0,maxHP]`)
    }
  }
  d.hpAfter = Math.max(d.currentHp - damage, 0)
  // Reboot有無の確定
  d.reboot = (d.hpAfter === 0)
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
        start: getCurrentTime(context).valueOf(),
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
      const result = calcLinkResult(context, d.link[idx], d, 0)
      // 例外的にリブートを伴わないリンク解除の場合は、リンクスコア＆経験値がアクセスのスコア＆経験値として加算
      d.exp.access += calcExp(result.totatlScore)
      side.score += result.totatlScore
    }
    // アクセスによる経験値付与
    const exp = d.exp.access + d.exp.skill
    if (d.who !== "other" || exp !== 0) {
      context.log.log(`経験値追加 ${d.name} ${d.currentExp}(current) + ${exp}(skill:${d.exp.skill}) -> ${d.currentExp + exp}`)
    }
    d.currentExp += exp
  })
  return state
}

function completeDisplayScoreExp(context: Context, state: AccessState, which: AccessSide): AccessState {
  const side = which === "offense" ? state.offense : state.defense
  if (side) {
    // 基本的には直接アクセスするでんこの経験値とスコア
    const d = side.formation[side.carIndex]
    side.displayedScore = side.score
    side.displayedExp = d.exp.access + d.exp.skill
    // 守備側がリブートした場合はその駅のリンクのスコア＆経験値を表示
    if (d.reboot && d.who === "defense") {
      const idx = d.link.findIndex(l => l.name === state.station.name)
      if (idx < 0) {
        context.log.error(`リブートした守備側のリンクが見つかりません ${state.station.name}`)
        throw Error()
      }
      const result = calcLinkResult(context, d.link[idx], d, 0)
      // アクセスの経験値として加算はするが、でんこ状態への反映はしない checkRebootLinksでまとめて加算
      side.displayedScore += result.totatlScore
      side.displayedExp += calcExp(result.totatlScore)
    }
  }
  return state
}
