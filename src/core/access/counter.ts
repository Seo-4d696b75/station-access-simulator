import { AccessDencoState, AccessSide, AccessSideState, AccessState } from "."
import { Context } from "../context"
import { Denco } from "../denco"
import { copyState, ReadonlyState } from "../state"
import { runAccessDamageCalculation } from "./main/execute"
import { hasDefense } from "./utils"

/**
 * カウンター攻撃を処理する
 * 
 * 攻守を入れ替えて通常のアクセス同様の処理を再度実行する  
 * ダメージ計算も通常通り行い元のアクセスの計算結果と合算する
 * 
 * @param context 
 * @param current 現在の状態
 * @param denco カウンター攻撃の主体 現在の守備側である必要あり
 * @returns カウンター攻撃終了後の状態 元のアクセス結果とカウンター攻撃の結果を合算した新しい状態
 */
export function counterAttack(context: Context, current: ReadonlyState<AccessState>, denco: Denco): AccessState {
  const state = copyState<AccessState>(current)
  // 面倒なので反撃は1回まで
  if (state.depth > 0) {
    context.log.warn("反撃は１回までだよ")
    return state
  }
  if (hasDefense(state)) {
    const idx = state.defense.formation.findIndex(d => d.numbering === denco.numbering)
    if (idx < 0) {
      context.log.error(`反撃するでんこが見つかりません ${denco.numbering} ${denco.name}`)
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
      linkDisconnected: false,
      pinkMode: false,
      pinkItemSet: false,
      pinkItemUsed: false,
      depth: state.depth + 1,
    }

    // カウンター実行
    context.log.log("攻守交代、カウンター攻撃を開始")
    const result = runAccessDamageCalculation(context, next)
    context.log.log("カウンター攻撃を終了")
    if (!result.defense) {
      context.log.error(`カウンター攻撃の結果に守備側が見つかりません`)
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
