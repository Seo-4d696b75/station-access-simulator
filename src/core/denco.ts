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
    ...state,
    link: Array.from(state.link),
    skillHolder: copySkillPossess(state.skillHolder),
    film: {
      ...state.film
    },
  }
}

export function getSkill(denco: DencoState): Skill {
  if ( denco.skillHolder.type === "possess"){
    return denco.skillHolder.skill
  }
  throw Error("skill not found")
}