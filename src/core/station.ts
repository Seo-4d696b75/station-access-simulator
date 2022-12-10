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
   * リンクの時間にのみ依存して計算される {@link ScorePredicate calcLinkScore}
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
   * - {@link linkScore}
   * - {@link comboBonus}
   * - {@link matchBonus}
   */
  totalScore: number
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
   * 全リンクスコア{@link link}の合計＝以下の合計
   * 
   * - {@link linkScore}
   * - {@link comboBonus}
   * - {@link matchBonus}
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

  // FIXME スコアアップの反映（現状ではリンクスコアアップは対応しない）
  // スキルによるスコアアップはリンクスコア対象外がほとんど
  //  score: number

  /**
   * 経験値合計
   * 
   * {@link LinkResult totalScore}を基に計算される  
   * 経験値増加の効果によりスコア値と一致しない場合がある
   */
  exp: number
}