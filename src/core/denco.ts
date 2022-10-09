import { Film } from "./film"
import { copySkill, SkillHolder } from "./skill"
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

export function copyDencoState(state: ReadonlyState<DencoState>): DencoState {
  return {
    numbering: state.numbering,
    name: state.name,
    attr: state.attr,
    type: state.type,
    level: state.level,
    currentHp: state.currentHp,
    maxHp: state.maxHp,
    currentExp: state.currentExp,
    nextExp: state.nextExp,
    ap: state.ap,
    link: Array.from(state.link),
    skill: copySkill(state.skill),
    film: {
      ...state.film
    },
  }
}

export function copyDencoStateTo(src: ReadonlyState<DencoState>, dst: DencoState) {
  if (src.numbering !== dst.numbering) {
    console.warn(`異なるでんこ間でコピーしています ${src.name} > ${dst.name}`)
  }
  dst.level = src.level
  dst.currentHp = src.currentHp
  dst.maxHp = src.maxHp
  dst.currentExp = src.currentExp
  dst.nextExp = src.nextExp
  dst.ap = src.ap
  dst.link = Array.from(src.link)
  dst.skill = copySkill(src.skill)
  dst.film = {
    ...src.film
  }
}