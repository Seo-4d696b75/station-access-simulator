import { AccessSide, AccessState } from ".."
import { Context } from "../../context"

/**
 * アクセス終了時の最終的なHPを決定・記録する（破壊的）
 * 
 * @param context 
 * @param state 
 * @param which 
 */
export function completeDencoHP(context: Context, state: AccessState, which: AccessSide) {
  updateDencoHP(context, state, which)
  const side = which === "offense" ? state.offense : state.defense
  side?.formation?.forEach(d => {
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
}

/**
 * アクセス中のダメージ量に従ってHPの変化・リブート有無を判定して記録する（破壊的）
 * 
 * hpAfter = max{0, hpCurrent(default:hpBefore) - damage(if any)}
 * reboot = (hpAfter === 0)
 * @param context 
 * @param state 
 */
export function updateDencoHP(context: Context, state: AccessState, which: AccessSide) {
  const side = which === "offense" ? state.offense : state.defense
  side?.formation?.forEach(d => {
    // HPの決定
    const damage = d.damage?.value ?? 0
    if (d.hpBefore !== d.currentHp) {
      context.log.log(`ダメージ計算以外でHPが変化しています ${d.name} ${d.hpBefore} > ${d.currentHp}`)
      if (d.currentHp < 0 || d.maxHp <= d.currentHp) {
        context.log.error(`現在のHPの値が不正です range[0,maxHP]`)
      }
    }
    // 回復も考慮して [0,maxHp]の範囲内を保証する
    d.hpAfter = Math.min(Math.max(d.currentHp - damage, 0), d.maxHp)
    // Reboot有無の確定
    d.reboot = (d.hpAfter === 0)
  })
}
