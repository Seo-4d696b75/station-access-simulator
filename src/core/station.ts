import { DencoAttribute } from "./denco";

export interface Station {
  name: string
  nameKana: string
  attr: DencoAttribute
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