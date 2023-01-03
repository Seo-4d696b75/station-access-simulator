import { DencoState } from "./denco";

export type StationAttribute =
  "eco" |
  "heat" |
  "cool" |
  "unknown"

export interface Station {
  name: string
  nameKana: string
  attr: StationAttribute
  lines: Line[]
}

export interface Line {
  name: string
}

export interface StationLink extends Station {
  start: number
}

export interface StationLinkStart extends StationLink {
  denco: DencoState
}

export interface LinkResult extends StationLink {
  /**
   * 該当リンクが解除されてこのリンクスコアが計算された時刻（unix time [ms]）
   */
  end: number
  /**
   * 当該リンクの長さ [ms]
   */
  duration: number
  /**
   * リンクの基本スコア
   * 
   * リンク時間に基づき計算します {@link ScorePredicate calcLinkScore}
   */
  linkScore: number
  /**
   * 複数リンクによるボーナススコア
   * 
   * リブート以外によるリンク解除時の場合は0
   */
  comboBonus: number

  matchAttr: boolean
  /**
   * 駅とリンク保持するでんこ属性の一致によるボーナススコア
   */
  matchBonus: number
  /**
   * スコア合計
   * 
   * ### 計算方法
   * - 1. スコアの合計を計算
   *   - {@link linkScore}
   *   - {@link comboBonus}
   *   - {@link matchBonus}
   * - 2. スキルによる獲得スコア増減を計算  
   *   {@link ScoreExpCalcState link}
   */
  totalScore: number

  /**
   * 経験値
   * 
   * ### 計算方法
   * - 1. スコアの総和を計算
   *   - {@link linkScore}
   *   - {@link comboBonus}
   *   - {@link matchBonus}
   * - 2. スキル・フィルムによる獲得経験値の増減を計算  
   *   {@link ScoreExpCalcState link}
   */
  exp: number
}

/**
 * 解除したリンクすべての結果
 * 
 * 原則としてアクセス処理中に発生したリブートによってリンクが解除されますが、
 * スキルによるリブート・フットバースによるリブートを伴わないリンク解除もあります
 */
export interface LinksResult {
  /**
   * リンクが解除されたタイミング
   */
  time: number
  /**
   * 解除されたリンクのスコア＆経験値が加算される直前の状態
   * 
   * 解除対象のリンクは{@link DencoState link}から削除済みです
   */
  denco: DencoState

  /**
   * 解除されたリンク
   * 
   * **リンク数が0の場合があります** リンクを保持しない状態でカウンター攻撃を受けるなどして
   * リブートした場合は空配列になります
   */
  link: LinkResult[]
  /**
   * スコア合計値
   * 
   * 各リンク結果{@link LinkResult totalScore}の合計
   */
  totalScore: number
  /**
   * リンクによるスコアの合計
   * 
   * 各リンク結果{@link LinkResult linkScore}の合計
   */
  linkScore: number
  /**
   * 複数リンクによるボーナススコアの合計
   * 
   * 各リンク結果{@link LinkResult comboBonus}の合計
   */
  comboBonus: number
  /**
   * 駅とでんこ属性一致によるボーナススコア
   * 
   * 各リンク結果{@link LinkResult matchBonus}の合計
   */
  matchBonus: number
  /**
   * 駅とでんこ属性が一致するリンクの数
   */
  matchCnt: number

  /**
   * 経験値合計
   * 
   * 各リンク結果{@link LinkResult exp}の合計
   */
  exp: number
}