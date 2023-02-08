import { FilmHolder } from "./film"
import { SkillHolder } from "./skill"
import { ReadonlyState } from "./state"
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

export function countDencoType(formation: readonly Denco[]): number {
  return countDencoBy(
    (d) => d.type,
    { formation: formation }
  )
}

type FormationArg<T> = {
  readonly formation: readonly T[]
}

export function countDencoOf<T extends Denco>(
  filter: (d: ReadonlyState<T>) => boolean,
  ...formation: (FormationArg<ReadonlyState<T>> | undefined)[]
): number {
  return formation
    .filter((a): a is FormationArg<ReadonlyState<T>> => !!a)
    .map(a => a.formation)
    .flat(1)
    .filter(d => filter(d))
    .length
}

export function countDencoBy<T extends Denco, R extends string | boolean | number>(
  converter: (d: ReadonlyState<T>) => R | null | undefined,
  ...formation: (FormationArg<ReadonlyState<T>> | undefined)[]
): number {
  const counts = new Set<R>()
  formation
    .filter((a): a is FormationArg<ReadonlyState<T>> => !!a)
    .map(a => a.formation)
    .flat(1)
    .map(d => converter(d))
    .filter((r): r is R => r !== undefined && r !== null)
    .forEach(r => counts.add(r))
  return counts.size
}