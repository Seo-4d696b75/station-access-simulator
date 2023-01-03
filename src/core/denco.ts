import { FilmHolder } from "./film"
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
  numbering: string

  /**
   * アルファベット表記の名前
   * 
   * 車両基地で表示される名前で、原則として{@link firstName}のアルファベット表記です
   */
  name: string

  /**
   * 苗字・ミドルネームを含む名前
   */
  fullName: string

  /**
   * でんこの名前
   * 
   * 車両編成画面で表示される名前で、苗字・ミドルネームは含みません
   */
  firstName: string

  type: DencoType
  attr: DencoAttribute
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
  film: FilmHolder

  link: StationLink[]
}

export function countDencoType(formation: Denco[]): number {
  const types = new Set<DencoType>()
  formation.forEach(d => types.add(d.type))
  return types.size
}