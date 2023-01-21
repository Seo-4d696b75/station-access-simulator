import { AccessState, getAccessDenco } from "."
import { Context } from "../context"
import { formatPercent } from "../format"
import { ReadonlyState } from "../state"
import { triggerSkillAfterDamage } from "./afterDamage"
import { updateDencoHP } from "./hp"
import { calcDamageBonusScoreExp } from "./score"
import { triggerAccessSkillAt } from "./_skill"
/**
 * アクセス中に各でんこに発生したダメージ
 * 
 * カウンター攻撃・攻撃の肩代わりなど直接アクセスを受けるでんこ以外でもダメージが発生する場合があります
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

/**
 * ダメージ量を加算
 * @param src 
 * @param damage 
 * @returns 
 */
export function addDamage(src: ReadonlyState<DamageState> | undefined, damage: DamageState): DamageState {
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
   * **非負数** 最終的なダメージ計算において固定ダメージ{@link AccessState damageFixed}の影響で負数になる場合は0に固定される
   */
  variable: number
  /**
   * `damage_fixed`以降の段階においても増減しない値
   * 
   * - 固定ダメージ{@link AccessState damageFixed}の影響を受けず最終的なダメージ量にそのまま加算されます
   * - 負数を指定した場合は回復として扱います
   */
  constant: number
}

/**
 * 被アクセス側が受けるダメージ値のうち`damage_common`までに計算される基本値を参照
 * 
 * - `state.damageBase`が定義済みの場合はその値を返す  
 * - 未定義の場合は {@link calcBaseDamage}で計算して返す  
 */
export function getBaseDamage(context: Context, state: ReadonlyState<AccessState>, option?: Partial<DamageCalcOption>): DamageCalcState {
  if (state.damageBase) {
    return state.damageBase
  }
  return {
    variable: calcAccessDamage(context, state, option),
    constant: 0,
  }
}

/**
 * ダメージ計算のオプション
 */
export interface DamageCalcOption {
  /**
   * ATK増減を考慮して計算する default: `true`
   * 
   * スキルによるATKの増減・フィルム補正の合計値を利用します
   */
  useATK: boolean
  /**
   * DEF増減を考慮して計算する default: `true`
   * 
   * スキルによるDEFの増減・フィルム補正の合計値を利用します
   */
  useDEF: boolean
  /**
   * アクセス・被アクセス個体間の属性による倍率補正を加味する default:`true`
   */
  useAttr: boolean
}

/**
 * 被アクセス側が受けるダメージ値のうち`damage_common`までに計算される基本値を計算
 * 
 * `AP * (100 + ATK - DEF)/100.0 * (damageRatio)`
 * 
 * @param state 現在のアクセス状態
 * @param option 計算の詳細を指定できます
 * @returns ダメージ値(>=0)
 */
export function calcAccessDamage(context: Context, state: ReadonlyState<AccessState>, option?: Partial<DamageCalcOption>): number {
  const setting = {
    useATK: true,
    useDEF: true,
    useAttr: true,
    ...option,
  }
  let atk = 0
  let def = 0
  let ratio = 1.0
  if (setting.useATK) {
    atk = state.attackPercent
  }
  if (setting.useDEF) {
    def = state.defendPercent
  }
  if (setting.useAttr) {
    ratio = state.damageRatio
  }
  const base = getAccessDenco(state, "offense").ap
  // ATK&DEF合計が0%未満になってもダメージ値は負数にはしない
  const damage = Math.max(1, Math.floor(base * (100 + atk - def) / 100.0 * ratio))
  context.log.log(`基本ダメージを計算 AP:${base} ATK:${atk}% DEF:${def}% DamageBase:${damage} = ${base} * ${100 + atk - def}% * ${ratio}`)
  return damage
}


export function runAccessDamageCalculation(context: Context, state: AccessState): AccessState {

  context.log.log("攻守のダメージ計算を開始")

  // 属性ダメージの補正値
  const attrOffense = getAccessDenco(state, "offense").attr
  const attrDefense = getAccessDenco(state, "defense").attr
  const attr = (attrOffense === "cool" && attrDefense === "heat") ||
    (attrOffense === "heat" && attrDefense === "eco") ||
    (attrOffense === "eco" && attrDefense === "cool")
  if (attr) {
    state.damageRatio = 1.3
    context.log.log("攻守の属性によるダメージ補正が適用：1.3")
  } else {
    state.damageRatio = 1.0
  }

  // filmによる増減の設定
  context.log.log("フィルムによるダメージ計算の補正")
  applyFilmDamagePercent(context, state)

  // ダメージ増減の設定
  context.log.log("スキルを評価：ATK&DEFの増減")
  state = triggerAccessSkillAt(context, state, "onAccessDamagePercent")

  // 特殊なダメージの計算
  context.log.log("スキルを評価：特殊なダメージ計算")
  state = triggerAccessSkillAt(context, state, "onAccessDamageSpecial")

  // 基本ダメージの計算
  if (!state.damageBase) {
    state.damageBase = {
      variable: calcAccessDamage(context, state),
      constant: 0
    }
  }

  // 固定ダメージの計算
  context.log.log("スキルを評価：固定ダメージ")
  state = triggerAccessSkillAt(context, state, "onAccessDamageFixed")
  context.log.log(`固定ダメージの計算：${state.damageFixed}`)

  // 最終ダメージ計算 固定ダメージ等の影響でも負数にはならない
  const defense = getAccessDenco(state, "defense")
  const damageBase = state.damageBase
  if (!damageBase) {
    context.log.error("基本ダメージの値が見つかりません")
  }
  if (damageBase.variable < 0) {
    context.log.error(`基本ダメージの値は非負である必要があります ${damageBase.variable}`)
  }
  if (damageBase.constant < 0) {
    context.log.log(`基本ダメージ(const.)の値が負数です(回復) ${damageBase.constant}`)
  }
  const damage = {
    // 固定ダメージで負数にはせず0以上に固定 & 確保されたダメージ量を加算
    value: Math.max(damageBase.variable + state.damageFixed, 0) + damageBase.constant,
    attr: state.damageRatio !== 1.0
  }
  // ダメージ量に応じたスコア＆経験値の追加
  const accessDenco = getAccessDenco(state, "offense")
  const [score, exp] = calcDamageBonusScoreExp(context, state.offense, damage.value)
  accessDenco.exp.access.damageBonus += exp
  state.offense.score.access.damageBonus += score
  context.log.log(`ダメージ量による追加 ${accessDenco.name} score:${score} exp:${exp}`)
  // 反撃など複数回のダメージ計算が発生する場合はそのまま加算
  const damageSum = addDamage(defense.damage, damage)
  context.log.log(`ダメージ計算が終了：${damageSum.value}`)

  // 攻守ふたりに関してアクセス結果を仮決定
  defense.damage = damageSum

  // HPの決定 & HP0 になったらリブート
  // 基本的には被アクセスのでんこのみで十分だが
  // スキルの影響で他でんこのHPが変化する場合もあるので全員確認する
  updateDencoHP(context, state, "offense")
  updateDencoHP(context, state, "defense")

  // 被アクセス側がリブートしたらリンク解除（ピンク除く）
  state.linkDisconnected = defense.reboot

  // 被アクセス側がリンク解除、かつアクセス側がリブートしていない
  state.linkSuccess = state.linkDisconnected

  context.log.log(`守備の結果 HP: ${defense.hpBefore} > ${defense.hpAfter} reboot:${defense.reboot}`)

  state = triggerSkillAfterDamage(context, state)

  return state
}

function applyFilmDamagePercent(context: Context, state: AccessState) {
  const offense = getAccessDenco(state, "offense")
  if (offense.film.type === "film" && offense.film.attackPercent) {
    state.attackPercent += offense.film.attackPercent
    context.log.log(`フィルム補正 ${offense.name} ATK${formatPercent(offense.film.attackPercent)}`)
  }
  const defense = getAccessDenco(state, "defense")
  if (defense.film.type === "film" && defense.film.defendPercent) {
    state.defendPercent += defense.film.defendPercent
    context.log.log(`フィルム補正 ${defense.name} DEF${formatPercent(defense.film.defendPercent)}`)
  }
}