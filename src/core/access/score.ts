/**
 * スコアと経験値の計算方法
 */
import { Context } from "../context"
import { Denco, DencoState } from "../denco"
import { copyState, ReadonlyState } from "../state"
import { LinkResult, LinksResult, Station, StationLink } from "../station"
import { AccessSideState, AccessState } from "./state"


/**
 * アクセス中に発生したスコア・経験値
 * 
 * この合計値がアクセスによって増加するスコア・経験値量になります
 * 
 * ### スコアの計算
 * スコアは**ユーザー単位で計算されます** {@link AccessSideState score}
 * 
 * ### 経験値の計算
 * **経験値は編成の各でんこ単位で計算されます** {@link AccessDencoState exp}
 * 
 * 基本は直接アクセスする・アクセスを受けるでんこのみ経験値を獲得しますが, 
 * カウンター攻撃やスキルの影響で編成内のでんこに経験値が発生する場合もあります.
 */
export interface ScoreExpState {

  // TODO ねこぱんの記載
  /**
   * アクセス中に発生する基本的なスコア・経験値
   * 
   * ### 含まれる値の種類
   * - アクセス開始時に直接アクセスするでんこに付与するスコア・経験値
   * - アクセス相手に与えたダメージ量に応じて付与するスコア・経験値
   * - リンク成功時に付与するスコア・経験値
   * 
   * ### 経験値の場合の注意
   * - 原則として直接アクセスするでんこにのみ発生します
   *   - 例外：ダメージ計算を伴うカウンター（シーナなど）ではダメージ量に応じた経験値が入ります
   * - スコアより経験値の方が多い場合があります
   *   - フィルムの獲得経験値増加の補正
   */
  access: number
  /**
   * スキルによるスコア・経験値
   * 
   * **経験値を配布するスキルでは配布対象外となります**
   */
  skill: number
  /**
   * アクセスによって解除されたリンクスコア・経験値
   * 
   * ### リブートの有無
   * - リブートした場合は解除されたリンクのスコア・経験値合計
   * - フットバースなどリブートを伴わない場合は解除されたリンクのみのスコア・経験値
   * 
   * ### 経験値の場合の注意
   * - 原則として直接アクセスを受けるでんこにのみ発生します
   *   - 例外：カウンターによりリブートする場合
   * - スコアより経験値の方が多い場合があります
   *   - フィルムの獲得経験値増加の補正
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
  calcAccessScore: (context: Context, state: ReadonlyState<AccessSideState>, station: ReadonlyState<Station>) => number

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

export function calcAccessScoreExp(context: Context, state: ReadonlyState<AccessSideState>, station: ReadonlyState<Station>): [number, number] {
  const predicate = context.scorePredicate?.calcAccessScore ?? DEFAULT_SCORE_PREDICATE.calcAccessScore
  const score = predicate(context, state, station)
  return [score, calcAccessScoreToExp(score, state)]
}

export function calcDamageScoreExp(context: Context, state: ReadonlyState<AccessSideState>, damage: number): [number, number] {
  const predicate = context.scorePredicate?.calcDamageScore ?? DEFAULT_SCORE_PREDICATE.calcDamageScore
  // ダメージ量が負数（回復）の場合は一律経験値1を与える
  const score = damage >= 0 ? predicate(context, damage) : 0
  const exp = damage >= 0 ? calcAccessScoreToExp(score, state) : 1
  return [score, exp]
}

export function calcLinkScoreExp(context: Context, state: ReadonlyState<AccessSideState>, access: ReadonlyState<AccessState>): [number, number] {
  const predicate = context.scorePredicate?.calcLinkSuccessScore ?? DEFAULT_SCORE_PREDICATE.calcLinkSuccessScore
  const score = predicate(context, state, access)
  return [score, calcAccessScoreToExp(score, state)]
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
export function calcLinksResult(context: Context, links: readonly StationLink[], d: ReadonlyState<DencoState>): LinksResult {
  const time = context.currentTime
  const linkResult = links.map((link, idx) => calcLinkResult(context, link, d, idx))
  const linkScore = linkResult.map(link => link.linkScore).reduce((a, b) => a + b, 0)
  const match = linkResult.filter(link => link.matchAttr)
  const matchBonus = match.map(link => link.matchBonus).reduce((a, b) => a + b, 0)
  const comboBonus = linkResult.map(link => link.comboBonus).reduce((a, b) => a + b, 0)
  const totalScore = linkScore + matchBonus + comboBonus
  const exp = calcLinkScoreToExp(totalScore, d)
  const result: LinksResult = {
    time: time,
    denco: copyState(d),
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
 * リンクスコア -> リンク経験値を計算
 * 
 * {@link ScoreExpState link}
 * @param score must be >= 0
 * @returns must be >= 0
 */
export function calcLinkScoreToExp(score: number, state: ReadonlyState<DencoState>): number {
  let percent = 100
  // フィルム補正
  const film = state.film
  if (film.type === "film" && film.expPercent) {
    percent += film.expPercent
  }
  return Math.floor(score * percent / 100)
}

// ScoreExpState.access アクセス開始・ダメージ量・リンク成功
function calcAccessScoreToExp(score: number, state: ReadonlyState<AccessSideState>): number {
  let percent = 100
  // フィルム補正
  const film = state.formation[state.carIndex].film
  if (film.type === "film" && film.expPercent) {
    percent += film.expPercent
  }
  // TODO ねこぱん
  return Math.floor(score * percent / 100)
}