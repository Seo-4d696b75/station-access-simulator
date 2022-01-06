import { AccessSide } from "./access";
import { Denco } from "./denco";

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

export interface LinkResult {
  station: Station
  start: number
  end: number
  duration: number
  score: number
  exp: number
  attr: boolean
}

export interface LinksResult {
  denco: Denco
  which: AccessSide
  link: LinkResult[]
  score: number
  exp: number
}