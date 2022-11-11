import { AccessSide, AccessState } from "."
import { Context } from "../context"
import { calcLinkResult, calcScoreToExp } from "./score"

/**
 * 表示用の経験値＆スコアの計算（破壊的）
 * 
 * @param context 
 * @param state 
 * @param which 
 */
export function completeDisplayScoreExp(context: Context, state: AccessState, which: AccessSide) {
  const side = which === "offense" ? state.offense : state.defense
  if (side) {
    // 基本的には直接アクセスするでんこの経験値とスコア
    const d = side.formation[side.carIndex]
    side.displayedScore = side.score.access + side.score.skill
    side.displayedExp = d.exp.access + d.exp.skill
    // 守備側がリンク解除（フットバースorリブート）した場合はその駅のリンクのスコア＆経験値を表示
    if (state.linkDisconnected && d.who === "defense") {
      const idx = d.link.findIndex(l => l.name === state.station.name)
      if (idx < 0) {
        context.log.error(`リブートした守備側のリンクが見つかりません ${state.station.name}`)
      }
      const result = calcLinkResult(context, d.link[idx], d, 0)
      side.displayedScore += result.totalScore
      side.displayedExp += calcScoreToExp(result.totalScore)
    }
  }
}
