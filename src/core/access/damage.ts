import { AccessState, getAccessDenco } from "."
import { Context } from "../context"
import { ReadonlyState } from "../state"

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
   */
  useATK: boolean
  /**
   * DEF増減を考慮して計算する default: `false`
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
