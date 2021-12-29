import seedrandom from "seedrandom"
import { Denco, DencoAttribute } from "./denco"
import { SkillEvaluationStep, SkillPossess, SkillPossessType, SkillState, Skill } from "./skill"
import manager, { SkillPropertyReader } from "./skill_manager"

export class Logger {

  constructor(type: string) {
    this.type = type
    this.time = Date.now()
  }

  type: string
  time: number
  logs: Array<Log> = []

  toString(): string {
    var str = ""
    str += "========================\n"
    str += `type: ${this.type}\n`
    str += `time: ${new Date(this.time).toTimeString()}\n`
    str += "------------------------\n"
    this.logs.forEach(log => {
      str += `[${log.tag}] ${log.message}\n`
    })
    str += "========================"
    return str
  }

  appendMessage(tag: LogTag, message: string) {
    this.logs.push({
      tag: tag,
      message: message
    })
  }

  log(message: string) {
    this.appendMessage(LogTag.LOG, message)
  }

  warn(message: string) {
    this.appendMessage(LogTag.WARN, message)
  }

  error(message: string) {
    this.appendMessage(LogTag.ERR, message)
    throw Error(message)
  }

}

enum LogTag {
  LOG = "L",
  WARN = "W",
  ERR = "E",
}

interface Log {
  tag: LogTag
  message: string
}

export interface DencoFormation {
  formation: Array<Denco>
  car_index: number
}

export interface AccessConfig {
  offense: DencoFormation
  defense?: DencoFormation

  use_pink: boolean
}

interface DencoState {
  self: Denco
  hp_before: number
  hp_after: number
  skill_invalidated: boolean
}

export interface ActiveSkillDenco {
  denco: Denco
  skill: Skill
  which: AccessSide
  car_index: number
  property_reader: SkillPropertyReader
}

interface AccessDencoState {
  denco: DencoState
  car_index: number
  formation: Array<DencoState>

  triggered_skills: Map<SkillEvaluationStep, Denco[]>

  probability_boost_percent: number
  probability_boosted: boolean

  damage: number
  damage_attr: boolean

  reboot: boolean

  score: number
  exp: number
}

export enum AccessSide {
  OFFENSE = "offense",
  DEFENSE = "defense"
}

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
  link: Denco | null

  pink_mode: boolean
  pink_item_set: boolean
  pink_item_used: boolean

  random: ((arg: number | void) => number)
}

function initAccessDencoState(f: DencoFormation): AccessDencoState {
  const formation = f.formation.map(e => {
    return {
      self: e,
      hp_before: e.current_hp,
      hp_after: e.current_hp,
    } as DencoState
  })
  return {
    denco: formation[f.car_index],
    car_index: f.car_index,
    formation: formation,
    triggered_skills: new Map(),
    probability_boost_percent: 0,
    probability_boosted: false,
    damage: 0,
    damage_attr: false,
    reboot: false,
    score: 0,
    exp: 0,
  }
}

export interface AccessResult {
  log: Logger
  offense: DencoFormation
  defense?: DencoFormation
}

export function executeAccess(config: AccessConfig) {
  var state: AccessState = {
    log: new Logger("access"),
    offense: initAccessDencoState(config.offense),
    defense: config.defense ? initAccessDencoState(config.defense) : null,
    damage_fixed: 0,
    attack_percent: 0,
    defend_percent: 0,
    damage_ratio: 1.0,
    link_success: false,
    link_disconneted: false,
    link: null,
    pink_mode: false,
    pink_item_set: config.use_pink,
    pink_item_used: false,
    random: seedrandom("test"),
  }


  state.log.log("アクセス処理の開始")
  execute(state)

}

function execute(state: AccessState, top: boolean = true) {

  if (top) {
    // log active skill
    var names = state.offense.formation
      .filter(d => hasActiveSkill(d))
      .map(d => d.self.name)
      .join(",")
    state.log.log(`攻撃：${state.offense.denco.self.name}`)
    state.log.log(`アクティブなスキル(攻撃側): ${names}`)

    if (!state.defense) state.log.log("守備側はいません")

    if (state.defense) {
      names = state.defense.formation
        .filter(d => hasActiveSkill(d))
        .map(d => d.self.name)
        .join(",")
      state.log.log(`守備：${state.defense.denco.self.name}`)
      state.log.log(`アクティブなスキル(守備側): ${names}`)

    }


    // pink_check
    // フットバの確認、アイテム優先=>スキル評価
    if (state.defense) {
      if (state.pink_item_set) {
        state.pink_item_used = true
        state.pink_mode = true
        state.log.log("フットバースアイテムを使用")
      } else {
        // PROBABILITY_CHECK の前に評価する
        // 現状メロしか存在せずこの実装でもよいだろう
        state.log.log("スキルを評価：フットバースの確認")
        evaluateSkillAt(state, SkillEvaluationStep.PINK_CHECK)
      }
    }
    if (state.pink_mode) state.log.log("フットバースが発動！")

    // 確率補正の可能性 とりあえず発動させて後で調整
    state.log.log("スキルを評価：確率ブーストの確認")
    evaluateSkillAt(state, SkillEvaluationStep.PROBABILITY_CHECK)
  }

  // 他ピンクに関係なく発動するもの
  state.log.log("スキルを評価：アクセス開始前")
  evaluateSkillAt(state, SkillEvaluationStep.BEFORE_ACCESS)
  state.log.log("スキルを評価：アクセス開始")
  evaluateSkillAt(state, SkillEvaluationStep.START_ACCESS)

  const offense = state.offense
  const defense = state.defense
  if (defense && !state.pink_mode) {
    state.log.log("攻守のダメージ計算を開始")

    // 属性ダメージの補正値
    const attr_offense = offense.denco.self.attr
    const attr_defense = defense.denco.self.attr
    const attr = (attr_offense === DencoAttribute.COOL && attr_defense === DencoAttribute.HEAT) ||
      (attr_offense === DencoAttribute.HEAT && attr_defense === DencoAttribute.ECO) ||
      (attr_offense === DencoAttribute.ECO && attr_defense === DencoAttribute.COOL)
    if (attr) {
      defense.damage_attr = true
      state.damage_ratio = 1.3
      state.log.log("攻守の属性によるダメージ補正が適用：1.3")
    } else {
      state.damage_ratio = 1.0
    }

    // TODO filmによる増減の設定
    state.log.warn("フィルムによる補正をスキップ")

    // ダメージ増減の設定
    state.log.log("スキルを評価：ATK&DEFの増減")
    evaluateSkillAt(state, SkillEvaluationStep.DAMAGE_COMMON)

    // 特殊なダメージの計算
    state.log.log("スキルを評価：特殊なダメージ計算")
    evaluateSkillAt(state, SkillEvaluationStep.DAMAGE_SPECIAL)

    // 基本ダメージの計算
    if (!state.damage_base) {
      const base = offense.denco.self.ap
      state.log.log(`基本ダメージを計算 AP:${base}`)
      state.damage_base = calcBaseDamage(state, base)
    }

    // 固定ダメージの計算
    if (state?.skip_damage_fixed) {
      state.log.log("スキルを評価：固定ダメージ")
      evaluateSkillAt(state, SkillEvaluationStep.DAMAGE_FIXED)
      state.log.log(`固定ダメージの計算：${state.damage_fixed}`)
    } else {
      state.log.log("固定ダメージの計算：スキップ")
    }

    // 最終ダメージ計算 固定ダメージ等の影響でも負数にはならない
    const damage = Math.max(state.damage_base + state.damage_fixed, 0)

    // 被アクセス側のダメージ確定
    defense.damage = damage
    defense.damage_attr = state.damage_ratio !== 1.0
    state.log.log(`ダメージ計算が終了：${damage}`)

    // HP0 になったらリブート
    defense.reboot = defense.damage >= defense.denco.hp_before

    // 被アクセス側がリブートしたらリンク解除（ピンク除く）
    state.link_disconneted = defense.reboot

    // 被アクセス側がリンク解除、かつアクセス側がリブートしていない
    state.link_success = state.link_disconneted

    state.log.log(`守備の結果 HP: ${defense.denco.hp_before} > ${defense.denco.hp_after} reboot:${defense.reboot}`)
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
  evaluateSkillAt(state, SkillEvaluationStep.AFTER_DAMAGE)

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
      state.link_disconneted = state.defense.reboot
      state.link_success = state.link_disconneted && !state.offense.reboot
    }
    state.log.log(`攻撃側のリンク成果：${state.link_success}`)
    state.log.log(`守備側のリンク解除：${state.link_disconneted}`)

  }

}

function evaluateSkillAt(state: AccessState, step: SkillEvaluationStep) {

  filterActiveSkill(state.offense.formation, AccessSide.OFFENSE).filter(d => {
    const s = d.skill
    return (!state.pink_mode || s.evaluate_in_pink)
      && canSkillEvaluated(state, step, d)
  }).forEach(d => {
    state = d.skill.evaluate ? d.skill.evaluate(state, step, d) : state
    markTriggerSkill(state.offense, step, d.denco)
    state.log.log(`スキルが発動(攻撃側). name:${d.denco.name}(${d.denco.numbering}) skill:${d.skill.name}`)
  })

  const defense = state.defense
  if (defense) {
    filterActiveSkill(defense.formation, AccessSide.DEFENSE).filter(d => {
      const s = d.skill
      return (!state.pink_mode || s.evaluate_in_pink)
        && canSkillEvaluated(state, step, d)
    }).forEach(d => {
      state = d.skill.evaluate ? d.skill.evaluate(state, step, d) : state
      markTriggerSkill(defense, step, d.denco)
      state.log.log(`スキルが発動(守備側). name:${d.denco.name}(${d.denco.numbering}) skill:${d.skill.name}`)
    })
  }
}

function markTriggerSkill(state: AccessDencoState, step: SkillEvaluationStep, denco: Denco) {
  let list = state.triggered_skills.get(step)
  if (!list) {
    list = []
    state.triggered_skills.set(step, list)
  }
  const idx = list.findIndex(d => d.numbering === denco.numbering)
  if (idx < 0) {
    list.push(denco)
  }
}

/**
 * 編成からアクティブなスキル（スキルの保有・スキル状態・スキル無効化の影響を考慮）を抽出する
 * @param list 
 * @param step 
 * @param which 
 * @returns 
 */
function filterActiveSkill(list: Array<DencoState>, which: AccessSide): Array<ActiveSkillDenco> {
  const result: Array<ActiveSkillDenco> = []
  list.forEach((d, idx) => {
    const s = d.self.skill
    if (hasActiveSkill(d) && s.skill) {
      result.push({
        denco: d.self,
        skill: s.skill,
        car_index: idx,
        which: which,
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
  return isSkillActive(d.self.skill) && !d.skill_invalidated
}

/**
 * スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
 * @param skill 
 * @returns 
 */
function isSkillActive(skill: SkillPossess): boolean {
  return skill.type === SkillPossessType.POSSESS && skill.skill.state === SkillState.ACTIVE
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
    if (random(state, trigger, d.which)) {
      return true
    } else {
      state.log.log(`skill not triggered. probability: ${trigger}`)
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
export function random(state: AccessState, percent: number, which: AccessSide): boolean {
  if (percent >= 100) return true
  const boost = which === AccessSide.OFFENSE ? state.offense.probability_boost_percent : state.defense?.probability_boost_percent
  if (boost) {
    if (boost !== 0) {
      const defense = state.defense
      if (which === AccessSide.DEFENSE) {
        state.offense.probability_boosted = true
      } else if (defense) {
        defense.probability_boosted = true
      }
    }
    return state.random(100) < percent * (1.0 + boost / 100.0)
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
    d.triggered_skills.delete(SkillEvaluationStep.PROBABILITY_CHECK)
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
  const damage = Math.floor(base * (1 + (100 + atk - def) / 100.0) * ratio)
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
    const idx = state.defense.formation.findIndex(d => d.self.numbering === denco.numbering)
    if (idx < 0) {
      state.log.error(`反撃するでんこが見つかりません ${denco.numbering} ${denco.name}`)
      return state
    }
    const offense_next = {
      ...state.defense,
      damage: 0,
      damage_attr: false,
      reboot: false,
      score: 0,
      exp: 0,
    }
    if (idx !== state.defense.car_index) {
      // 編成内の直接アクセスされた以外のでんこによる反撃
      offense_next.car_index = idx
      offense_next.denco = offense_next.formation[idx]
    }
    const defense_next = {
      ...state.offense,
      damage: 0,
      damage_attr: false,
      reboot: false,
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
      link: null,
      pink_mode: false,
      pink_item_set: false,
      pink_item_used: false,
      random: state.random,
    }

    // カウンター実行
    state.log.log("攻守交代、カウンター攻撃を開始")
    execute(next, false)
    state.log.log("カウンター攻撃を終了")

    // カウンターによるダメージの反映
    state.offense.damage += defense_next.damage
    state.offense.damage_attr = defense_next.damage_attr
    // 被アクセス側であってもスキル等によりスコア＆EXPが加算される場合がある
    state.offense.exp += defense_next.exp
    state.offense.score += defense_next.score
    if (idx === state.defense.car_index) {
      // 被アクセス側本人のカウンター攻撃
      state.defense.damage += offense_next.damage // 二重反撃など
      state.defense.damage_attr = state.defense.damage_attr || offense_next.damage_attr
      // カウンターは通常のアクセスと同様処理のためスコア＆EXPが加算される
      state.defense.score += offense_next.score
      state.defense.exp += offense_next.exp
    } else {
      // 被アクセス側本人以外のカウンター攻撃
      state.defense.score += offense_next.score
      completeDencoAccess(state, offense_next)
    }
  } else {
    state.log.error("相手が存在しないので反撃はできません")
  }
  return state
}

function completeDencoAccess(state: AccessState, s: AccessDencoState) {
  const denco = s.denco.self
  // HPの反映
  s.denco.hp_after = Math.max(s.denco.hp_before - s.damage, 0)
  // カウンターによりリブートする場合あり
  s.reboot = s.denco.hp_after === 0
  if (s.reboot) {
    denco.current_hp = denco.max_hp
  } else {
    denco.current_hp = s.denco.hp_after
  }
  // EXP の反映
  denco.current_exp += s.exp
  // TODO レベルアップ処理

  state.log.log(`HP確定 ${denco.name} ${s.denco.hp_before} > ${s.denco.hp_after}`)
}