import { AccessSide } from "./access";
import { DencoState } from "./denco";
import { ReadonlyState } from "./state";

export type StationAttribute =
  "eco" |
  "heat" |
  "cool" |
  "unknown"

export interface Station {
  readonly name: string
  readonly nameKana: string
  readonly attr: StationAttribute
}

export interface StationLink extends Station {
  readonly start: number
}

export interface LinkResult extends StationLink {
  /**
   * 該当リンクが解除されてこのリンクスコアが計算された時刻（unix time [ms]）
   */
  readonly end: number
  /**
   * 当該リンクの長さ [ms]
   */
  readonly duration: number
  /**
   * リンクの基本スコア
   * 
   * リンクの時間にのみ依存して計算される {@link ScorePredicate calcLinkScore}
   */
  readonly linkScore: number
  /**
   * 複数リンクによるボーナススコア
   * 
   * リブート以外によるリンク解除時の場合は0
   */
  readonly comboBonus: number

  readonly matchAttr: boolean
  /**
   * 駅とリンク保持するでんこ属性の一致によるボーナススコア
   */
  readonly matchBonus: number
  /**
   * スコア合計
   * 
   * - {@link linkScore}
   * - {@link comboBonus}
   * - {@link matchBonus}
   */
  readonly totalScore: number
}

/**
 * リブートにより手放したリンクすべての結果
 */
export interface LinksResult {
  /**
   * リブートしたタイミング
   */
  readonly time: number
  /**
   * リブートしてリンクスコア＆経験値が加算される直前の状態
   * リブートしたリンクは解除されている
   */
  readonly denco: ReadonlyState<DencoState>
  readonly which: AccessSide
  readonly link: readonly LinkResult[]
  /**
   * スコア合計値
   * 
   * 全リンクスコア{@link link}の合計＝以下の合計
   * 
   * - {@link linkScore}
   * - {@link comboBonus}
   * - {@link matchBonus}
   */
  readonly totalScore: number
  /**
   * リンクによるスコアの合計
   * 
   * 各リンク結果{@link LinkResult linkScore}の合計
   */
  readonly linkScore: number
  /**
   * 複数リンクによるボーナススコアの合計
   * 
   * 各リンク結果{@link LinkResult comboBonus}の合計
   */
  readonly comboBonus: number
  /**
   * 駅とでんこ属性一致によるボーナススコア
   * 
   * 各リンク結果{@link LinkResult matchBonus}の合計
   */
  readonly matchBonus: number
  /**
   * 駅とでんこ属性が一致するリンクの数
   */
  readonly matchCnt: number
  /**
   * 経験値合計
   * 
   * {@link totalScore}を基に計算される  
   * 経験値増加の効果によりスコア値と一致しない場合がある
   */
  readonly exp: number
}