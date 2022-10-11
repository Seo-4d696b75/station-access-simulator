import { Film } from "./film"
import { SkillHolder } from "./skill"
import { StationLink } from "./station"

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


/**
 * でんこ個体の情報
 * 原則として変化する状態を持たない
 */
export interface Denco {
  readonly numbering: string
  readonly name: string
  readonly type: DencoType
  readonly attr: DencoAttribute
}

/**
 * 状態を保持する
 */
export interface DencoState extends Denco {

  level: number
  nextExp: number
  currentExp: number
  maxHp: number
  currentHp: number
  ap: number

  skill: SkillHolder
  film: Film

  link: StationLink[]
}