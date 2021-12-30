import seedrandom from "seedrandom"
import { Denco } from "./denco"
import { SkillEvaluationStep, SkillPossess, Skill } from "./skill"
import { SkillPropertyReader } from "./skill_manager"
import { Logger } from "./log"

export interface DencoFormation {
  formation: Array<Denco>
  car_index: number
}

/**
 * アクセス処理の入力・設定を定義します
 */
export interface AccessConfig {
  /**
   * 攻撃側の編成
   */
  offense: DencoFormation
  /**
   * 守備側の編成
   */
  defense?: DencoFormation
  /**
   * フットバースアイテム使用の有無を指定する
   */
  use_pink?: boolean
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
  car_index: number
  hp_before: number
  hp_after: number
  skill_invalidated: boolean
  reboot: boolean
}

export interface ActiveSkillDenco extends DencoState {
  property_reader: SkillPropertyReader
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
  formation: Array<DencoState>
  car_index: number

  triggered_skills: TriggeredSkill[]

  probability_boost_percent: number
  probability_boosted: boolean

  damage?: DamageState

  score: number
  exp: number
}

export type AccessSide =
  "offense" |
  "defense"

type Random = () => number

export interface AccessState {
  log: Logger
  offense: AccessDencoState
  defense: AccessDencoState | null
  previous?: AccessState

  damage_base?: number
  skip_damage_fixed?: boolean
  damage_fixed: number

  attack_percent: number
  defend_percent: number
  damage_ratio: number

  link_success: boolean
  link_disconneted: boolean

  pink_mode: boolean
  pink_item_set: boolean
  pink_item_used: boolean

  random: Random | "ignore" | "force"
}

function initAccessDencoState(f: DencoFormation, which: AccessSide): AccessDencoState {
  const formation = f.formation.map((e, idx) => {
    const s: DencoState = {
      denco: e,
      hp_before: e.current_hp,
      hp_after: e.current_hp,
      which: which,
      who: idx === f.car_index ? which : "other",
      car_index: idx,
      reboot: false,
      skill_invalidated: false,
    }
    return s
  })
  return {
    car_index: f.car_index,
    formation: formation,
    triggered_skills: [],
    probability_boost_percent: 0,
    probability_boosted: false,
    score: 0,
    exp: 0,
  }
}

export function executeAccess(config: AccessConfig): AccessState {
  var state: AccessState = {
    log: new Logger("access"),
    offense: initAccessDencoState(config.offense, "offense"),
    defense: config.defense ? initAccessDencoState(config.defense, "defense") : null,
    damage_fixed: 0,
    attack_percent: 0,
    defend_percent: 0,
    damage_ratio: 1.0,
    link_success: false,
    link_disconneted: false,
    pink_mode: false,
    pink_item_set: !!config.use_pink,
    pink_item_used: false,
    random: config.probability ? config.probability : seedrandom("test"),
  }


  state.log.log("アクセス処理の開始")
  return execute(state)

}

function getDenco(state: AccessState, which: AccessSide): Denco {
  var s = which === "offense" ? state.offense : getDefense(state)
  return s.formation[s.car_index].denco
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

  const has_defense = !!state.defense
  if (top) {
    // log active skill
    var names = state.offense.formation
      .filter(d => hasActiveSkill(d))
      .map(d => d.denco.name)
      .join(",")
    state.log.log(`攻撃：${getDenco(state, "offense").name}`)
    state.log.log(`アクティブなスキル(攻撃側): ${names}`)

    if (!has_defense) state.log.log("守備側はいません")

    if (has_defense) {
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
    if (has_defense) {
      if (state.pink_item_set) {
        state.pink_item_used = true
        state.pink_mode = true
        state.log.log("フットバースアイテムを使用")
      } else {
        // PROBABILITY_CHECK の前に評価する
        // 現状メロしか存在せずこの実装でもよいだろう
        state.log.log("スキルを評価：フットバースの確認")
        state = evaluateSkillAt(state, "pink_check")
      }
    }
    if (state.pink_mode) state.log.log("フットバースが発動！")

    // 確率補正の可能性 とりあえず発動させて後で調整
    state.log.log("スキルを評価：確率ブーストの確認")
    state = evaluateSkillAt(state, "probability_check")
  }

  // 他ピンクに関係なく発動するもの
  state.log.log("スキルを評価：アクセス開始前")
  state = evaluateSkillAt(state, "before_access")
  state.log.log("スキルを評価：アクセス開始")
  state = evaluateSkillAt(state, "start_access")


  if (has_defense && !state.pink_mode) {
    state.log.log("攻守のダメージ計算を開始")

    // 属性ダメージの補正値
    const attr_offense = getDenco(state, "offense").attr
    const attr_defense = getDenco(state, "defense").attr
    const attr = (attr_offense === "cool" && attr_defense === "heat") ||
      (attr_offense === "heat" && attr_defense === "eco") ||
      (attr_offense === "eco" && attr_defense === "cool")
    if (attr) {
      state.damage_ratio = 1.3
      state.log.log("攻守の属性によるダメージ補正が適用：1.3")
    } else {
      state.damage_ratio = 1.0
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
    if (!state.damage_base) {
      const base = getDenco(state, "offense").ap
      state.log.log(`基本ダメージを計算 AP:${base}`)
      state.damage_base = calcBaseDamage(state, base)
    }

    // 固定ダメージの計算
    if (state?.skip_damage_fixed) {
      state.log.log("スキルを評価：固定ダメージ")
      state = evaluateSkillAt(state, "damage_fixed")
      state.log.log(`固定ダメージの計算：${state.damage_fixed}`)
    } else {
      state.log.log("固定ダメージの計算：スキップ")
    }

    // 最終ダメージ計算 固定ダメージ等の影響でも負数にはならない
    const damage_base = state.damage_base
    if (!damage_base) {
      state.log.error("基本ダメージの値が見つかりません")
      throw Error("base damage not set")
    }
    const damage = Math.max(damage_base + state.damage_fixed, 0)

    // 被アクセス側のダメージ確定
    const defense = getDefense(state)
    defense.damage = {
      value: damage,
      attr: state.damage_ratio !== 1.0
    }
    state.log.log(`ダメージ計算が終了：${damage}`)

    // HP0 になったらリブート
    const d = defense.formation[defense.car_index]
    d.hp_after = Math.max(d.hp_before - damage, 0)
    d.reboot = damage >= d.hp_before

    // 被アクセス側がリブートしたらリンク解除（ピンク除く）
    state.link_disconneted = d.reboot

    // 被アクセス側がリンク解除、かつアクセス側がリブートしていない
    state.link_success = state.link_disconneted

    state.log.log(`守備の結果 HP: ${d.hp_before} > ${d.hp_after} reboot:${d.reboot}`)
  } else if (state.pink_mode) {
    // ピンク
    state.link_disconneted = true
    state.link_success = true
  } else {
    // 相手不在
    state.link_success = true
  }

  state.log.log("アクセス結果を仮決定")
  state.log.log(`攻撃側のリンク成果：${state.link_success}`)
  state.log.log(`守備側のリンク解除：${state.link_disconneted}`)

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
      var d = state.defense.formation[state.defense.car_index]
      state.link_disconneted = d.reboot
      d = state.offense.formation[state.offense.car_index]
      state.link_success = state.link_disconneted && !d.reboot
    }
    state.log.log(`攻撃側のリンク成果：${state.link_success}`)
    state.log.log(`守備側のリンク解除：${state.link_disconneted}`)

  }
  return state
}

function evaluateSkillAt(state: AccessState, step: SkillEvaluationStep): AccessState {

  filterActiveSkill(state.offense.formation, "offense", state.offense.car_index).filter(d => {
    const s = d.skill
    return (!state.pink_mode || s.evaluate_in_pink)
      && canSkillEvaluated(state, step, d)
  }).forEach(d => {
    markTriggerSkill(state.offense, step, d.denco)
    state.log.log(`スキルが発動(攻撃側) name:${d.denco.name}(${d.denco.numbering}) skill:${d.skill.name}`)
    state = d.skill.evaluate ? d.skill.evaluate(state, step, d) : state
  })

  const defense = state.defense
  if (defense) {
    filterActiveSkill(defense.formation, "defense", defense.car_index).filter(d => {
      const s = d.skill
      return (!state.pink_mode || s.evaluate_in_pink)
        && canSkillEvaluated(state, step, d)
    }).forEach(d => {
      markTriggerSkill(defense, step, d.denco)
      state.log.log(`スキルが発動(守備側) name:${d.denco.name}(${d.denco.numbering}) skill:${d.skill.name}`)
      state = d.skill.evaluate ? d.skill.evaluate(state, step, d) : state
    })
  }
  return state
}

function markTriggerSkill(state: AccessDencoState, step: SkillEvaluationStep, denco: Denco) {
  const list = state.triggered_skills
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
function filterActiveSkill(list: Array<DencoState>, which: AccessSide, access_idx: number): Array<ActiveSkillDenco> {
  const result: Array<ActiveSkillDenco> = []
  list.forEach((d, idx) => {
    const s = d.denco.skill
    if (hasActiveSkill(d) && s.skill) {
      result.push({
        ...d,
        skill: s.skill,
        property_reader: s.skill.property_reader
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
  return isSkillActive(d.denco.skill) && !d.skill_invalidated
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
  const trigger = d.skill.can_evaluate ? d.skill.can_evaluate(state, step, d) : false
  if (typeof trigger === 'boolean') {
    return trigger
  } else {
    if (state.random === "force") {
      state.log.log("確率計算は無視されます mode: force")
      return true
    }
    if (state.random === "ignore") {
      state.log.log("確率計算は無視されます mode: ignore")
      return false
    }
    if (random(state, state.random, trigger, d.which)) {
      state.log.log(`スキルが発動できます ${d.denco.name} 確率:${trigger}`)
      return true
    } else {
      state.log.log(`スキルが発動しませんでした ${d.denco.name} 確率:${trigger}`)
      return false
    }
  }
}

/**
 * 確率ブーストも考慮して確率を乱数を計算する
 * @param state ここの確率ブースト＆乱数器を使用する
 * @param percent 100分率で指定した確立でtrueを返す
 * @param which どっちサイドの確立ブーストを適用するか
 * @returns 
 */
export function random(state: AccessState, random: Random, percent: number, which: AccessSide): boolean {
  if (percent >= 100) return true
  const boost = which === "offense" ? state.offense.probability_boost_percent : state.defense?.probability_boost_percent
  if (boost) {
    if (boost !== 0) {
      const defense = state.defense
      if (which === "defense") {
        state.offense.probability_boosted = true
      } else if (defense) {
        defense.probability_boosted = true
      }
    }
    return random() < (percent * (1.0 + boost / 100.0)) / 100.0
  } else {
    state.log.error("defense not set, but try to read probability_boost_percent")
    return false
  }
}

/**
 * 発動したものの影響がなかった確率ブーストのスキルを発動しなかったことにする
 * @param d 
 */
function checkProbabilityBoost(d: AccessDencoState) {
  if (!d.probability_boosted && d.probability_boost_percent !== 0) {
    d.triggered_skills = d.triggered_skills.filter(s => s.step !== "probability_check")
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
    atk = state.attack_percent
  }
  if (useDEF) {
    def = state.defend_percent
  }
  if (useAttr) {
    ratio = state.damage_ratio
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
    const offense_next: AccessDencoState = {
      car_index: idx,
      formation: turnFromation(state.defense.formation, "defense", idx),
      triggered_skills: state.defense.triggered_skills,
      probability_boost_percent: state.defense.probability_boost_percent,
      probability_boosted: state.defense.probability_boosted,
      score: 0,
      exp: 0,
    }
    // 原則さっきまでのoffense
    const defense_next: AccessDencoState = {
      ...state.offense,
      formation: turnFromation(state.offense.formation, "offense", state.offense.car_index),
      score: 0,
      exp: 0,
    }
    const next: AccessState = {
      log: state.log,
      offense: offense_next,
      defense: defense_next,
      damage_fixed: 0,
      attack_percent: 0,
      defend_percent: 0,
      damage_ratio: 1.0,
      link_success: false,
      link_disconneted: false,
      pink_mode: false,
      pink_item_set: false,
      pink_item_used: false,
      random: state.random,
      previous: state,
    }

    // カウンター実行
    state.log.log("攻守交代、カウンター攻撃を開始")
    const result = execute(next, false)
    state.log.log("カウンター攻撃を終了")
    const offense_result = result.offense
    const defense_result = getDefense(result)

    // カウンターによるダメージ・Score・EXPの反映 AccessDencoState
    if (state.offense.damage) {
      state.log.error("攻撃側にダメージが発生しています")
    }
    state.offense.damage = defense_result.damage
    // 被アクセス側であってもスキル等によりスコア＆EXPが加算される場合がある
    state.offense.exp += defense_result.exp
    state.offense.score += defense_result.score
    if (idx === state.defense.car_index) {
      // 被アクセス側本人のカウンター攻撃
      const previous = getDamage(state.defense)
      const add = offense_result.damage
      if (add) {
        // 二重反撃などでカウンター中にダメージを受ける場合
        state.defense.damage = {
          value: previous.value + add.value,
          attr: previous.attr || add.attr
        }
      }
      // カウンターは通常のアクセスと同様処理のためスコア＆EXPが加算される
      state.defense.score += offense_result.score
      state.defense.exp += offense_result.exp
    } else {
      // 被アクセス側本人以外のカウンター攻撃
      state.defense.score += offense_result.score
      completeDencoAccess(result, offense_result)
    }

    // カウンター攻撃によるでんこ状態の反映 DencoState[]
    state.offense.formation = turnFromation(defense_result.formation, "defense", state.offense.car_index)
    state.defense.formation = turnFromation(offense_result.formation, "offense", state.defense.car_index)
  } else {
    state.log.error("相手が存在しないので反撃はできません")
  }
  return state
}

function turnFromation(formation: DencoState[], current_side: AccessSide, next_access_idx: number): DencoState[] {
  const next_side = current_side === "defense" ? "offense" : "defense"
  return formation.map(s => {
    var next: DencoState = {
      ...s,
      which: next_side,
      who: s.car_index === next_access_idx ? next_side : "other",
    }
    return next
  })
}

function completeDencoAccess(state: AccessState, s: AccessDencoState) {
  const denco = s.formation[s.car_index]
  // HPの反映
  if (s.damage) {
    const damage = s.damage.value
    denco.hp_after = Math.max(denco.hp_before - damage, 0)
  }
  // カウンターによりリブートする場合あり
  denco.reboot = denco.hp_after === 0
  const self = denco.denco
  if (denco.reboot) {
    self.current_hp = self.max_hp
  } else {
    self.current_hp = denco.hp_after
  }
  // EXP の反映
  self.current_exp += s.exp
  // TODO レベルアップ処理

  state.log.log(`HP確定 ${self.name} ${denco.hp_before} > ${denco.hp_after}`)
}