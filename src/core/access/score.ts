/**
 * スコアと経験値の計算方法
 */
import { copy } from "../../"
import { Context } from "../context"
import { ReadonlyState } from "../state"
import { LinkResult, LinksResult, Station, StationLink } from "../station"
import { AccessDencoState, AccessSideState, AccessState } from "./state"


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
  /**
   * 「アクセスしたとき獲得するスコア・経験値」
   * 
   * アクセス中に発生する基本的なスコア・経験値
   * 
   * ### 注意
   * - 経験値は原則として直接アクセスするでんこにのみ発生します
   *   - 例外：ダメージ計算を伴うカウンター（シーナなど）ではダメージ量に応じた経験値が入ります
   * - スコアと経験値が異なる場合があります
   *   - フィルムの獲得経験値増加の補正
   *   - スキルによるスコア増加
   */
  access: AccessScoreExpState

  /**
   * スキルによるスコア・経験値
   * 
   * ### 注意
   * - 経験値を配布するスキルでは配布対象外となります
   * - 獲得するスコア・経験値を増加させるスキルの影響を受けません  
   *   スキル説明にある「他のスキルによって獲得したスコアは効果の対象外です」の対象外に該当します
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
 * アクセス中に発生したスコア・経験値
 * 
 * **スキル・フィルムによる獲得するスコア・経験値の増減が影響しています**
 */
export interface ScoreExpResult extends ScoreExpState {

  access: AccessScoreExpResult

  /**
   * 合計値  
   * - {@link access}
   * - {@link skill}
   * - {@link link}
   */
  total: number
}

// FIXME ねこぱんの影響
/**
 * 「アクセスしたとき獲得するスコア・経験値」
 */
export interface AccessScoreExpState {
  /**
   * アクセス開始時に直接アクセスするでんこに付与するスコア・経験値  
   * その日◯駅目のボーナス・月新駅・赤新駅のボーナスなど  
   * {@link ScorePredicate calcAccessScore}の値をもとに計算します
   */
  accessBonus: number

  /**
   * 「与ダメージによるボーナス」  
   * 
   * アクセス相手に与えたダメージ量に応じて付与するスコア・経験値  
   * {@link ScorePredicate calcDamageScore}の値をもとに計算します
   */
  damageBonus: number

  /**
   * 「リンクするときに獲得するボーナス」
   * 
   * リンク成功時に付与するスコア・経験値  
   * {@link ScorePredicate calcLinkSuccessScore}の値をもとに計算します
   */
  linkBonus: number
}

/**
 * 「アクセスしたとき獲得するスコア・経験値」
 * 
 * **スキル・フィルムによる獲得するスコア・経験値の増減が影響しています**
 */
export interface AccessScoreExpResult extends AccessScoreExpState {
  /**
   * 合計値  
   * - {@link accessBonus}
   * - {@link damageBonus}
   * - {@link linkBonus}
   */
  total: number
}

export function addScoreExpBoost(dst: ScoreExpBoostPercent, src: ReadonlyState<ScoreExpBoostPercent>) {
  dst.access += src.access
  dst.accessBonus += src.accessBonus
  dst.damageBonus += src.damageBonus
  dst.linkBonus += src.linkBonus
  dst.link += src.link
}

/**
 * 獲得するスコア・経験値の増減量を%単位で指定します
 * 
 * ### 獲得するスコア・経験値の増加と追加の違い
 * 「経験値を与える」「スコアを追加する」など固定値で追加する場合は{@link ScoreExpState}に直接加算してください
 */
export interface ScoreExpBoostPercent {

  /**
   * 「アクセスしたとき獲得するスコア・経験値」の増加量[%]
   * 
   * 以下３種類の内訳があります. 
   * **`access`に指定した増加量は各内訳の増加量[%]に加算して計算されます**
   * - {@link accessBonus}
   * - {@link damageBonus}
   * - {@link linkBonus}
   */
  access: number

  /**
   * アクセス開始時に付与するスコア・経験値の増加量[%]  
   * 
   * その日◯駅目のボーナス・月新駅・赤新駅のボーナスなど  
   */
  accessBonus: number

  /**
   * 「与ダメージによるボーナス」の増加量[%] 
   */
  damageBonus: number

  /**
   * 「リンクするときに獲得するボーナス」の増加量[%]
   * 
   * アクセス時にリンク成功した場合に獲得するスコア・経験値です. 
   * **リンク保持によるスコア・経験値とは異なります**
   */
  linkBonus: number

  /**
   * 「リンク保持で獲得する」スコア・経験値の増加量[%]
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
   * アクセス相手ユーザ・でんこやリンク成功可否などに依存しません  
   * (ex) その日◯駅目のボーナス・月新駅・赤新駅のボーナスなど
   * 
   * @param state アクセスする本人を含む編成の現在の状態
   * @param station アクセスする駅
   */
  calcAccessBonus: (context: Context, state: ReadonlyState<AccessSideState>, station: ReadonlyState<Station>) => number

  /**
   * 「リンクのボーナス」
   * 
   * アクセス側がリンク成功時に取得するスコアを計算  
   * @param state アクセスする本人を含む編成の現在の状態
   * @param access アクセスの状態
   */
  calcLinkBonus: (context: Context, state: ReadonlyState<AccessSideState>, access: ReadonlyState<AccessState>) => number

  /**
   * 「与ダメージによるボーナス」  
   * 
   * 相手に与えたダメージ量に応じたスコアを計算
   * @param damage ダメージ量(>=0)
   */
  calcDamageBonus: (context: Context, damage: number) => number
  /**
   * リンク保持によるスコアを計算
   * 
   * コンボボーナス・属性ボーナスの値は含まずリンクによる基本スコア値のみ計算する
   */
  calcLinkScore: (context: Context, link: StationLink) => number
}

/**
 * contextに指定がない場合のfallback
 */
const DEFAULT_SCORE_PREDICATE: ScorePredicate = {
  calcAccessBonus: (context, state, station) => 100,
  calcLinkBonus: (context, state, access) => 100,
  calcDamageBonus: (context, damage) => Math.floor(damage),
  calcLinkScore: (context, link) => Math.floor((context.currentTime - link.start) / 100)
}

export function calcAccessBonusScoreExp(context: Context, state: ReadonlyState<AccessSideState>, station: ReadonlyState<Station>): [number, number] {
  const predicate = context.scorePredicate?.calcAccessBonus ?? DEFAULT_SCORE_PREDICATE.calcAccessBonus
  const score = predicate(context, state, station)
  // 基本的にスコアと経験値は同じ？
  return [score, score]
}

export function calcDamageBonusScoreExp(context: Context, state: ReadonlyState<AccessSideState>, damage: number): [number, number] {
  const predicate = context.scorePredicate?.calcDamageBonus ?? DEFAULT_SCORE_PREDICATE.calcDamageBonus
  const score = damage >= 0 ? predicate(context, damage) : 0
  // ダメージ量が負数（回復）の場合など経験値0は一律経験値1を与える
  const exp = Math.max(score, 1)
  return [score, exp]
}

export function calcLinkBonusScoreExp(context: Context, state: ReadonlyState<AccessSideState>, access: ReadonlyState<AccessState>): [number, number] {
  const predicate = context.scorePredicate?.calcLinkBonus ?? DEFAULT_SCORE_PREDICATE.calcLinkBonus
  const score = predicate(context, state, access)
  // 基本的にスコアと経験値は同じ？
  return [score, score]
}

export function calcLinkResult(context: Context, link: StationLink, state: ReadonlyState<Omit<AccessSideState, "user">>, dencoIdx: number, linkIdx: number): LinkResult {
  const time = context.currentTime
  const duration = time - link.start
  if (duration < 0) {
    context.log.error(`リンク時間が負数です ${duration}[ms] ${JSON.stringify(link)}`)
  }
  const d = state.formation[dencoIdx]
  const predicate = context.scorePredicate?.calcLinkScore ?? DEFAULT_SCORE_PREDICATE.calcLinkScore
  const score = predicate(context, link)
  const attr = (link.attr === d.attr)
  const ratio = (linkIdx < LINK_COMBO_RATIO.length) ?
    LINK_COMBO_RATIO[linkIdx] : LINK_COMBO_RATIO[LINK_COMBO_RATIO.length - 1]
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
    totalScore: calcScorePercent(score + match + combo, state, "link"),
    exp: calcExpPercent(score + match + combo, d, "link")
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
 * 
 * スキル・フィルムによる獲得スコア・経験値の増減は反映済み
 * @param context 
 * @param links 解除するリンク
 * @returns 
 */
export function calcLinksResult(context: Context, links: readonly StationLink[], state: ReadonlyState<Omit<AccessSideState, "user">>, dencoIdx: number): LinksResult {
  const time = context.currentTime
  const linkResult = links.map((link, idx) => calcLinkResult(context, link, state, dencoIdx, idx))
  const linkScore = linkResult.map(link => link.linkScore).reduce((a, b) => a + b, 0)
  const match = linkResult.filter(link => link.matchAttr)
  const matchBonus = match.map(link => link.matchBonus).reduce((a, b) => a + b, 0)
  const comboBonus = linkResult.map(link => link.comboBonus).reduce((a, b) => a + b, 0)
  const totalScore = linkResult.map(link => link.totalScore).reduce((a, b) => a + b, 0)
  const exp = linkResult.map(link => link.exp).reduce((a, b) => a + b, 0)
  const result: LinksResult = {
    time: time,
    denco: copy.DencoState(state.formation[dencoIdx]),
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
 * see {@link ScoreExpState}
 * スキルによるスコア・経験値付与（固定値）は変化しない！
 */
type ScoreExpCalcType =
  "access_bonus" |
  "damage_bonus" |
  "link_bonus" |
  "link"

/**
 * スキルによるスコア増加量を計算する
 * @param score 
 * @param state 
 * @returns 
 */
export function calcScorePercent(score: number, state: ReadonlyState<Omit<AccessSideState, "user">>, type: ScoreExpCalcType): number {
  let percent = 100
  switch (type) {
    case "access_bonus":
      percent += (state.scorePercent.access + state.scorePercent.accessBonus)
      break
    case "damage_bonus":
      percent += (state.scorePercent.access + state.scorePercent.damageBonus)
      break
    case "link_bonus":
      percent += (state.scorePercent.access + state.scorePercent.linkBonus)
      break
    case "link":
      percent += state.scorePercent.link
  }
  return Math.floor(score * percent / 100)
}

// FIXME ねこぱん未実装
/**
 * スキル・フィルムによる経験値増加量を計算する
 * 
 * @param exp 
 * @param state 
 * @param type 
 * @returns 
 */
export function calcExpPercent(exp: number, state: ReadonlyState<AccessDencoState>, type: ScoreExpCalcType): number {
  let percent = 100
  switch (type) {
    case "access_bonus":
      percent += (state.expPercent.access + state.expPercent.accessBonus)
      break
    case "damage_bonus":
      percent += (state.expPercent.access + state.expPercent.damageBonus)
      break
    case "link_bonus":
      percent += (state.expPercent.access + state.expPercent.linkBonus)
      break
    case "link":
      percent += state.expPercent.link
  }
  return Math.floor(exp * percent / 100)
}