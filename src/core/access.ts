import seedrandom from "seedrandom"
import { Denco } from "./denco"
import { SkillPossess, Skill } from "./skill"
import { SkillPropertyReader } from "./skillManager"
import { Event } from "./event"
import { Random, Context, Logger } from "./context"
import { Station, StationLink } from "./station"

/**
 * アクセスするでんこの設定
 */
export interface AccessDenco {
  /**
   * 現在の編成状態
   */
  formation: Denco[]
  /**
   * アクセスする（攻撃・守備側）でんこの編成内のindex  
   * 0 <= carIndex < formation.length
   */
  carIndex: number
}

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
  offense: AccessDenco
  /**
   * アクセス先の駅
   */
  station: Station
  /**
   * 守備側の編成
   */
  defense?: AccessDenco
  /**
   * フットバースアイテム使用の有無を指定する
   */
  usePink?: boolean
  /**
   * 発動条件が確率に依存する場合の挙動を指定できます
   * - "ignore": 必ず発動しない
   * - "force": 必ず発動する
   */
  probability?: "ignore" | "force"
}

/**
 * アクセス処理中の両編成の各でんこの状態
 */
export interface DencoState {
  denco: Denco
  which: AccessSide
  who: "defense" | "offense" | "other"
  carIndex: number
  hpBefore: number
  hpAfter: number
  skillInvalidated: boolean
  reboot: boolean
}

export interface ActiveSkillDenco extends DencoState {
  propertyReader: SkillPropertyReader
  skill: Skill
}

export interface TriggeredSkill {
  denco: Denco
  step: SkillEvaluationStep
}

export interface DamageState {
  value: number
  attr: boolean
}

/**
 * アクセスの攻守ふたりの状態
 */
export interface AccessDencoState {
  /**
   * 自身側の編成一覧
   */
  formation: DencoState[]
  /**
   * 編成内における自身の位置
   */
  carIndex: number
  /**
   * formation[carIndex]と同一オブジェクト
   */
  self: DencoState

  triggeredSkills: TriggeredSkill[]

  probabilityBoostPercent: number
  probabilityBoosted: boolean

  damage?: DamageState

  score: number
  exp: number
}

export interface DefenseDencoState extends AccessDencoState {
  /**
   * アクセスされている駅に対応するリンク
   */
  link: StationLink
}

export type AccessSide =
  "offense" |
  "defense"

export interface AccessState {
  log: Logger
  station: Station
  offense: AccessDencoState
  defense?: AccessDencoState
  previous?: AccessState

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

  random: Random | "ignore" | "force"
}

function initAccessDencoState(f: AccessDenco, which: AccessSide): AccessDencoState {
  const formation = f.formation.map((e, idx) => {
    const s: DencoState = {
      denco: e,
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
    self: formation[f.carIndex],
    triggeredSkills: [],
    probabilityBoostPercent: 0,
    probabilityBoosted: false,
    score: 0,
    exp: 0,
  }
}

export interface AfterAccessState extends Context {
  offense: Denco[]
  defense?: Denco[]
  event: Event[]
}

export function startAccess(context: Context, config: AccessConfig): AfterAccessState {
  var state: AccessState = {
    log: context.log,
    station: config.station,
    offense: initAccessDencoState(config.offense, "offense"),
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
    random: config.probability ? config.probability : context.random,
  }

  // アクセス駅とリンクの確認
  const d = state.offense.self
  const idx = d.denco.link.findIndex(link => link.name === config.station.name)
  if (idx >= 0) {
    state.log.warn(`攻撃側(${d.denco.name})のリンクに対象駅(${config.station.name})が含まれています,削除します`)
    d.denco.link = d.denco.link.splice(idx, 1)
  }
  if (config.defense) {
    const defense = initAccessDencoState(config.defense, "defense")
    const d = defense.self
    var link = d.denco.link.find(link => link.name === config.station.name)
    if (!link) {
      state.log.warn(`守備側(${d.denco.name})のリンクに対象駅(${config.station.name})が含まれていません,追加します`)
      link = {
        ...config.station,
        start: Date.now() - 100
      }
      d.denco.link.push(link)
    }
    state.defense = defense
  }


  state.log.log("アクセス処理の開始")
  state = execute(state)
  state.log.log("アクセス処理の終了")

  return completeAccess(context, state)
}

function completeAccess(context: Context, state: AccessState): AfterAccessState {
  // このアクセスイベントの追加
  var afterState: AfterAccessState = {
    ...context,
    offense: state.offense.formation.map(s => s.denco),
    defense: state.defense?.formation?.map(s => s.denco),
    event: [{
      type: "access",
      data: state
    }]
  }
  // リブートイベントの追加
  const offense = state.offense.formation[state.offense.carIndex]
  if (offense.reboot) {
    afterState.event.push({
      type: "reboot",
      data: {
        denco: offense.denco,
        which: "offense",
        link: []
      }
    })
  }

  // レベルアップ処理

  // アクセス直後のスキル発動イベント
  filterActiveSkill(state.offense.formation).forEach(d => {
    const nextState = d.skill.onAccessComplete?.(afterState, d)
    if (nextState) {
      afterState = nextState
    }
  })
  if (state.defense) {
    filterActiveSkill(state.defense.formation).forEach(d => {
      const nextState = d.skill.onAccessComplete?.(afterState, d)
      if (nextState) {
        afterState = nextState
      }
    })
  }
  return afterState
}

function getDenco(state: AccessState, which: AccessSide): Denco {
  var s = which === "offense" ? state.offense : getDefense(state)
  return s.formation[s.carIndex].denco
}

function getDefense(state: AccessState): AccessDencoState {
  const s = state.defense
  if (!s) {
    state.log.error("守備側が見つかりません")
    throw Error("defense not found")
  }
  return s
}

function getDamage(state: AccessDencoState): DamageState {
  const d = state.damage
  if (!d) {
    throw Error("no damage state found")
  }
  return d
}

function execute(state: AccessState, top: boolean = true): AccessState {

  const hasDefense = !!state.defense
  if (top) {
    // log active skill
    var names = state.offense.formation
      .filter(d => hasActiveSkill(d))
      .map(d => d.denco.name)
      .join(",")
    state.log.log(`攻撃：${getDenco(state, "offense").name}`)
    state.log.log(`アクティブなスキル(攻撃側): ${names}`)

    if (!hasDefense) state.log.log("守備側はいません")

    if (hasDefense) {
      const defense = getDefense(state)
      names = defense.formation
        .filter(d => hasActiveSkill(d))
        .map(d => d.denco.name)
        .join(",")
      state.log.log(`守備：${getDenco(state, "defense").name}`)
      state.log.log(`アクティブなスキル(守備側): ${names}`)

    }


    // pink_check
    // フットバの確認、アイテム優先=>スキル評価
    if (hasDefense) {
      if (state.pinkItemSet) {
        state.pinkItemUsed = true
        state.pinkMode = true
        state.log.log("フットバースアイテムを使用")
      } else {
        // PROBABILITY_CHECK の前に評価する
        // 現状メロしか存在せずこの実装でもよいだろう
        state.log.log("スキルを評価：フットバースの確認")
        state = evaluateSkillAt(state, "pink_check")
      }
    }
    if (state.pinkMode) state.log.log("フットバースが発動！")

    // 確率補正の可能性 とりあえず発動させて後で調整
    state.log.log("スキルを評価：確率ブーストの確認")
    state = evaluateSkillAt(state, "probability_check")
  }

  // 他ピンクに関係なく発動するもの
  state.log.log("スキルを評価：アクセス開始前")
  state = evaluateSkillAt(state, "before_access")
  state.log.log("スキルを評価：アクセス開始")
  state = evaluateSkillAt(state, "start_access")


  if (hasDefense && !state.pinkMode) {
    state.log.log("攻守のダメージ計算を開始")

    // 属性ダメージの補正値
    const attrOffense = getDenco(state, "offense").attr
    const attrDefense = getDenco(state, "defense").attr
    const attr = (attrOffense === "cool" && attrDefense === "heat") ||
      (attrOffense === "heat" && attrDefense === "eco") ||
      (attrOffense === "eco" && attrDefense === "cool")
    if (attr) {
      state.damageRatio = 1.3
      state.log.log("攻守の属性によるダメージ補正が適用：1.3")
    } else {
      state.damageRatio = 1.0
    }

    // TODO filmによる増減の設定
    state.log.warn("フィルムによる補正をスキップ")

    // ダメージ増減の設定
    state.log.log("スキルを評価：ATK&DEFの増減")
    state = evaluateSkillAt(state, "damage_common")

    // 特殊なダメージの計算
    state.log.log("スキルを評価：特殊なダメージ計算")
    state = evaluateSkillAt(state, "damage_special")

    // 基本ダメージの計算
    if (!state.damageBase) {
      const base = getDenco(state, "offense").ap
      state.log.log(`基本ダメージを計算 AP:${base}`)
      state.damageBase = calcBaseDamage(state, base)
    }

    // 固定ダメージの計算
    if (state?.skipDamageFixed) {
      state.log.log("固定ダメージの計算：スキップ")
    } else {
      state.log.log("スキルを評価：固定ダメージ")
      state = evaluateSkillAt(state, "damage_fixed")
      state.log.log(`固定ダメージの計算：${state.damageFixed}`)
    }

    // 最終ダメージ計算 固定ダメージ等の影響でも負数にはならない
    const damageBase = state.damageBase
    if (!damageBase) {
      state.log.error("基本ダメージの値が見つかりません")
      throw Error("base damage not set")
    }
    const damage = Math.max(damageBase + state.damageFixed, 0)

    // 被アクセス側のダメージ確定
    const defense = getDefense(state)
    defense.damage = {
      value: damage,
      attr: state.damageRatio !== 1.0
    }
    state.log.log(`ダメージ計算が終了：${damage}`)

    // HP0 になったらリブート
    const d = defense.formation[defense.carIndex]
    d.hpAfter = Math.max(d.hpBefore - damage, 0)
    d.reboot = damage >= d.hpBefore

    // 被アクセス側がリブートしたらリンク解除（ピンク除く）
    state.linkDisconncted = d.reboot

    // 被アクセス側がリンク解除、かつアクセス側がリブートしていない
    state.linkSuccess = state.linkDisconncted

    state.log.log(`守備の結果 HP: ${d.hpBefore} > ${d.hpAfter} reboot:${d.reboot}`)
  } else if (state.pinkMode) {
    // ピンク
    state.linkDisconncted = true
    state.linkSuccess = true
  } else {
    // 相手不在
    state.linkSuccess = true
  }

  state.log.log("アクセス結果を仮決定")
  state.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
  state.log.log(`守備側のリンク解除：${state.linkDisconncted}`)

  state.log.log("スキルを評価：ダメージ計算完了後")
  state = evaluateSkillAt(state, "after_damage")

  if (top) {
    state.log.log("最終的なアクセス結果を決定")
    // 最後に確率ブーストの有無を判定
    checkProbabilityBoost(state.offense)
    if (state.defense) {
      checkProbabilityBoost(state.defense)
    }

    // 最終的なリブート有無＆変化後のHPを計算
    completeDencoAccess(state, state.offense)
    if (state.defense) {
      completeDencoAccess(state, state.defense)
    }

    // 最終的なアクセス結果を計算 カウンターで変化する場合あり
    if (state.defense) {
      var d = state.defense.formation[state.defense.carIndex]
      state.linkDisconncted = d.reboot
      d = state.offense.formation[state.offense.carIndex]
      state.linkSuccess = state.linkDisconncted && !d.reboot
    }
    state.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
    state.log.log(`守備側のリンク解除：${state.linkDisconncted}`)

  }
  return state
}

function evaluateSkillAt(state: AccessState, step: SkillEvaluationStep): AccessState {

  const offenseDenco = filterActiveSkill(state.offense.formation).filter(d => {
    const s = d.skill
    return (!state.pinkMode || s.evaluateInPink)
      && canSkillEvaluated(state, step, d)
  })
  const defense = state.defense
  const defenseDenco = defense ? filterActiveSkill(defense.formation).filter(d => {
    const s = d.skill
    return (!state.pinkMode || s.evaluateInPink)
      && canSkillEvaluated(state, step, d)
  }) : []

  offenseDenco.forEach(d => {
    markTriggerSkill(state.offense, step, d.denco)
    state.log.log(`スキルが発動(攻撃側) name:${d.denco.name}(${d.denco.numbering}) skill:${d.skill.name}`)
    state = d.skill.evaluate ? d.skill.evaluate(state, step, d) : state
  })

  defenseDenco.forEach(d => {
    markTriggerSkill(defense as AccessDencoState, step, d.denco)
    state.log.log(`スキルが発動(守備側) name:${d.denco.name}(${d.denco.numbering}) skill:${d.skill.name}`)
    state = d.skill.evaluate ? d.skill.evaluate(state, step, d) : state
  })
  return state
}

function markTriggerSkill(state: AccessDencoState, step: SkillEvaluationStep, denco: Denco) {
  const list = state.triggeredSkills
  const idx = list.findIndex(d => d.denco.numbering === denco.numbering)
  if (idx < 0) {
    list.push({
      denco: denco,
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
function filterActiveSkill(list: DencoState[]): ActiveSkillDenco[] {
  const result: ActiveSkillDenco[] = []
  list.forEach((d, idx) => {
    const s = d.denco.skill
    if (hasActiveSkill(d) && s.skill) {
      result.push({
        ...d,
        skill: s.skill,
        propertyReader: s.skill.propertyReader
      })
    }
  })
  return result
}

/**
 * アクセス中のスキル無効化の影響も考慮してアクティブなスキルか判定
 * @param d 
 * @returns 
 */
function hasActiveSkill(d: DencoState): boolean {
  return isSkillActive(d.denco.skill) && !d.skillInvalidated
}

/**
 * スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
 * @param skill 
 * @returns 
 */
function isSkillActive(skill: SkillPossess): boolean {
  return skill.type === "possess" && skill.skill.state === "active"
}

/**
 * スキルのロジックと発動確率まで総合して発動有無を判定する
 * @param state 
 * @param d 発動する可能性があるアクティブなスキル
 * @returns 
 */
function canSkillEvaluated(state: AccessState, step: SkillEvaluationStep, d: ActiveSkillDenco): boolean {
  const trigger = d.skill.canEvaluate ? d.skill.canEvaluate(state, step, d) : false
  if (typeof trigger === 'boolean') {
    return trigger
  }
  if (random(state, trigger, d.which)) {
    state.log.log(`スキルが発動できます ${d.denco.name} 確率:${trigger}%`)
    return true
  } else {
    state.log.log(`スキルが発動しませんでした ${d.denco.name} 確率:${trigger}%`)
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
export function random(state: AccessState, percent: number, which: AccessSide): boolean {
  if (percent >= 100) return true
  const boost = which === "offense" ? state.offense.probabilityBoostPercent : state.defense?.probabilityBoostPercent
  if (!boost) {
    state.log.error("存在しない守備側の確率補正計算を実行しようとしました")
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
  if (state.random === "force") {
    state.log.log("確率計算は無視されます mode: force")
    return true
  }
  if (state.random === "ignore") {
    state.log.log("確率計算は無視されます mode: ignore")
    return false
  }
  return state.random() < (percent * (1.0 + boost / 100.0)) / 100.0
}

/**
 * 発動したものの影響がなかった確率ブーストのスキルを発動しなかったことにする
 * @param d 
 */
function checkProbabilityBoost(d: AccessDencoState) {
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
function calcBaseDamage(state: AccessState, base: number, useAKT: boolean = true, useDEF: boolean = true, useAttr: boolean = true): number {
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
  state.log.log(`基本ダメージを計算 ATK:${atk}% DEF:${def}% ${base} * ${100 + atk - def}% * ${ratio} = ${damage}`)
  return damage
}

export function counterAttack(state: AccessState, denco: Denco): AccessState {
  // 面倒なので反撃は1回まで
  if (state.previous) {
    state.log.warn("反撃は１回までだよ")
    return state
  }
  if (state.defense) {
    const idx = state.defense.formation.findIndex(d => d.denco.numbering === denco.numbering)
    if (idx < 0) {
      state.log.error(`反撃するでんこが見つかりません ${denco.numbering} ${denco.name}`)
      return state
    }
    // 編成内の直接アクセスされた以外のでんこによる反撃の場合もあるため慎重に
    const offenseNextFormation = turnFromation(state.defense.formation, "defense", idx)
    const offenseNext: AccessDencoState = {
      carIndex: idx,
      formation: offenseNextFormation,
      self: offenseNextFormation[idx],
      triggeredSkills: state.defense.triggeredSkills,
      probabilityBoostPercent: state.defense.probabilityBoostPercent,
      probabilityBoosted: state.defense.probabilityBoosted,
      score: 0,
      exp: 0,
    }
    // 原則さっきまでのoffense
    const defenseNextFormation = turnFromation(state.offense.formation, "offense", state.offense.carIndex)
    const defenseNext: AccessDencoState = {
      ...state.offense,
      formation: defenseNextFormation,
      self: defenseNextFormation[state.offense.carIndex],
      score: 0,
      exp: 0,
    }
    const next: AccessState = {
      log: state.log,
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
      random: state.random,
      previous: state,
    }

    // カウンター実行
    state.log.log("攻守交代、カウンター攻撃を開始")
    const result = execute(next, false)
    state.log.log("カウンター攻撃を終了")
    const offenseResult = result.offense
    const defenseResult = getDefense(result)

    // カウンターによるダメージ・Score・EXPの反映 AccessDencoState
    if (state.offense.damage) {
      state.log.error("攻撃側にダメージが発生しています")
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
      completeDencoAccess(result, offenseResult)
    }

    // カウンター攻撃によるでんこ状態の反映 DencoState[]
    state.offense.formation = turnFromation(defenseResult.formation, "defense", state.offense.carIndex)
    state.defense.formation = turnFromation(offenseResult.formation, "offense", state.defense.carIndex)
  } else {
    state.log.error("相手が存在しないので反撃はできません")
  }
  return state
}

function turnFromation(formation: DencoState[], currentSide: AccessSide, nextAccessIdx: number): DencoState[] {
  const nextSide = currentSide === "defense" ? "offense" : "defense"
  return formation.map(s => {
    var next: DencoState = {
      ...s,
      which: nextSide,
      who: s.carIndex === nextAccessIdx ? nextSide : "other",
    }
    return next
  })
}

function completeDencoAccess(state: AccessState, s: AccessDencoState) {
  const denco = s.formation[s.carIndex]
  // HPの反映
  if (s.damage) {
    const damage = s.damage.value
    denco.hpAfter = Math.max(denco.hpBefore - damage, 0)
  }
  // カウンターによりリブートする場合あり
  denco.reboot = denco.hpAfter === 0
  const self = denco.denco
  if (denco.reboot) {
    self.currentHp = self.maxHp
  } else {
    self.currentHp = denco.hpAfter
  }
  // EXP の反映
  self.currentExp += s.exp

  state.log.log(`HP確定 ${self.name} ${denco.hpBefore} > ${denco.hpAfter} reboot:${denco.reboot}`)
}