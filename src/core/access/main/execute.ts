import { AccessState, addDamage, calcAccessDamage, getAccessDenco } from ".."
import { Context } from "../../context"
import { copyState, ReadonlyState } from "../../state"
import { calcDamageScoreExp } from "../score"
import { updateDencoHP } from "./hp"
import { triggerSkillAt } from "./skill"

/**
 * アクセスを処理する
 * 
 * スキル発動・ダメージ計算・HPの変化・リンク成功・リブート有無までを処理する.  
 * アクセス直後に発動する特殊なスキル発動までは含まない
 * 
 * @param context 
 * @param initial アクセス開始時の状態
 * @param top このアクセスがトップレベルの呼び出しか カウンター攻撃などの場合は`false`を指定してください
 * @returns アクセス終了後の状態
 */
export function execute(context: Context, initial: ReadonlyState<AccessState>, top: boolean = true): AccessState {
  let state = copyState<AccessState>(initial)

  
  return state
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

  // TODO filmによる増減の設定
  context.log.warn("フィルムによる補正をスキップ")

  // ダメージ増減の設定
  context.log.log("スキルを評価：ATK&DEFの増減")
  state = triggerSkillAt(context, state, "damage_common")

  // 特殊なダメージの計算
  context.log.log("スキルを評価：特殊なダメージ計算")
  state = triggerSkillAt(context, state, "damage_special")

  // 基本ダメージの計算
  if (!state.damageBase) {
    state.damageBase = {
      variable: calcAccessDamage(context, state),
      constant: 0
    }
  }

  // 固定ダメージの計算
  context.log.log("スキルを評価：固定ダメージ")
  state = triggerSkillAt(context, state, "damage_fixed")
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
  const [score, exp] = calcDamageScoreExp(context, damage.value)
  const accessDenco = getAccessDenco(state, "offense")
  accessDenco.exp.access += exp
  state.offense.score.access += score
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

  return state
}
