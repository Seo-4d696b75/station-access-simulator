import { copySkillPossess, Skill, SkillPossess, SkillState } from "./skill"
import { Film } from "./film"
import { StationLink } from "./station"
import { ReadonlyState } from "./user"

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
export type Denco = Readonly<{
  numbering: string
  name: string
  type: DencoType
  attr: DencoAttribute
}>

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

  skillHolder: SkillPossess
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
    skillHolder: copySkillPossess(state.skillHolder),
    film: {
      ...state.film
    },
  }
}

export function getSkill(denco: DencoState): Skill {
  if (denco.skillHolder.type === "possess") {
    return denco.skillHolder.skill
  }
  throw Error("skill not found")
}