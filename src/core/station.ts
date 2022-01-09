import { AccessSide } from "./access";
import { Denco, DencoState } from "./denco";

export type StationAttribute = 
  "eco" |
  "heat" |
  "cool" |
  "unknown"

export interface Station {
  name: string
  nameKana: string
  attr: StationAttribute
}

export interface StationLink extends Station {
  start: number
}

export interface LinkResult extends StationLink {
  end: number
  duration: number
  score: number
  matchBonus?: number
}

export interface LinksResult {
  /**
   * リブートしたタイミング
   */
  time: number
  /**
   * リブートしてリンクスコア＆経験値が加算される直前の状態
   */
  denco: DencoState
  which: AccessSide
  link: LinkResult[]
  totalScore: number
  linkScore: number
  comboBonus: number
  matchBonus: number
  matchCnt: number
  exp: number
}