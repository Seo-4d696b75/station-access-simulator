/**
 * スコアと経験値の計算方法
 */
import { Context } from "../context"
import { copyDencoState, Denco, DencoState } from "../denco"
import { LinkResult, LinksResult, Station, StationLink } from "../station"
import { ReadonlyState } from "../user"
import { AccessSide, AccessSideState, AccessState } from "./access"


/**
* アクセス中に発生したスコア・経験値
* 
* - アクセス開始時に付与される経験値
* - リンク成功時に付与される経験値
* - スキルによる経験値付与
* - リブートした場合を除くリンク解除時の経験値付与
*/
export interface ScoreExpState {
  /**
   * アクセスの開始時・リンク成功時に付与される値
     */
  access: number
  /**
 * スキルによる付与値
   */
  skill: number
  /**
   * アクセスによって解除されたリンクスコア・経験値
   */
  link: number
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
   * @param damage ダメージ量(>=0)
   */
  calcDamageScore: (context: Context, damage: number) => number
  /**
   * リンク保持によるスコアを計算
   * 
   * コンボボーナス・属性ボーナスの値は含まずリンクによる基本スコア値のみ計算する
   */
  calcLinkScore: (context: Context, link: StationLink) => number
}

/**
 * contextに指定がない場合のfall-back
 */
const DEFAULT_SCORE_PREDICATE: ScorePredicate = {
  calcAccessScore: (context, state, station) => 100,
  calcLinkSuccessScore: (context, state, access) => 100,
  calcDamageScore: (context, damage) => Math.floor(damage),
  calcLinkScore: (context, link) => Math.floor((context.currentTime - link.start) / 100)
}

export function calcAccessScoreExp(context: Context, state: ReadonlyState<AccessSideState>, station: Station): [number, number] {
  const predicate = context.scorePredicate?.calcAccessScore ?? DEFAULT_SCORE_PREDICATE.calcAccessScore
  const score = predicate(context, state, station)
  return [score, calcScoreToExp(score)]
}

export function calcDamageScoreExp(context: Context, damage: number): [number, number] {
  const predicate = context.scorePredicate?.calcDamageScore ?? DEFAULT_SCORE_PREDICATE.calcDamageScore
  // ダメージ量が負数（回復）の場合は一律経験値1を与える
  const score = damage >= 0 ? predicate(context, damage) : 0
  const exp = damage >= 0 ? calcScoreToExp(score) : 1
  return [score, exp]
}

export function calcLinkScoreExp(context: Context, state: ReadonlyState<AccessSideState>, access: ReadonlyState<AccessState>): [number, number] {
  const predicate = context.scorePredicate?.calcLinkSuccessScore ?? DEFAULT_SCORE_PREDICATE.calcLinkSuccessScore
  const score = predicate(context, state, access)
  return [score, calcScoreToExp(score)]
}

export function calcLinkResult(context: Context, link: StationLink, d: Denco, idx: number): LinkResult {
  const time = context.currentTime
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
    totalScore: score + match + combo,
  }
}

const LINK_COMBO_RATIO: readonly number[] = [
  1.0, 1.1, 1.2, 1.3, 1.4,
  1.6, 1, 7, 1.9, 2.1, 2.3,
  2.5, 2.8, 3.1, 3.4, 3.7,
  4.1, 4.5, 5.0, 5.5, 6.1,
  6.7, 7.4, 8.1, 8.9, 9.8,
  10.8, 11.9, 13.1, 14.4, 15.8,
  17.4, 19.1, 20.0
]

/**
 * 指定したリンクを解除したリンク結果を計算する
 * @param context 
 * @param links 解除するリンク
 * @param d 対象のリンクを解除した直後の状態
 * @param which アクセス時にどちら側か
 * @returns 
 */
export function calcLinksResult(context: Context, links: readonly StationLink[], d: ReadonlyState<DencoState>, which: AccessSide): LinksResult {
  const time = context.currentTime
  const linkResult = links.map((link, idx) => calcLinkResult(context, link, d, idx))
  const linkScore = linkResult.map(link => link.linkScore).reduce((a, b) => a + b, 0)
  const match = linkResult.filter(link => link.matchAttr)
  const matchBonus = match.map(link => link.matchBonus).reduce((a, b) => a + b, 0)
  const comboBonus = linkResult.map(link => link.comboBonus).reduce((a, b) => a + b, 0)
  const totalScore = linkScore + matchBonus + comboBonus
  const exp = calcScoreToExp(totalScore)
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

/**
 * スコア -> 経験値を計算
 * @param score must be >= 0
 * @returns must be >= 0
 */
export function calcScoreToExp(score: number): number {
  // TODO 経験値増加の加味
  return score
}