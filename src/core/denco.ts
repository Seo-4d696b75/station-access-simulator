import { SkillPossess } from "./skill"
import { Film } from "./film"

export type DencoType =
  "attacker" |
  "defender" |
  "supporter" |
  "trickster"

export type DencoAttribute =
  "cool" |
  "heat" |
  "eco" |
  "flat"

export interface Denco {
  numbering: string
  name: string
  type: DencoType
  attr: DencoAttribute

  level: number
  next_exp: number
  current_exp: number
  max_hp: number
  current_hp: number
  ap: number

  skill: SkillPossess
  film: Film
}