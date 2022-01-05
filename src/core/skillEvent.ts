import * as access from "./access";
import { Denco } from "./denco";
import { SkillTriggerEvent } from "./event";
import { Logger } from "./log";
import { isSkillActive, ProbabilityPercent, Skill } from "./skill";
import { SkillPropertyReader } from "./skillManager";


export interface DencoState {
  denco: Denco
  who: "self" | "other"
  carIndex: number
  skillInvalidated: boolean
}

export interface ActiveSkillDenco {
  propertyReader: SkillPropertyReader
  skill: Skill
}

export interface SkillEventState {
  log: Logger

  formation: Array<DencoState>
  carIndex: number

  triggeredSkills: Denco[]

  probability?: ProbabilityPercent 
  probabilityBoostPercent: number

  random: access.Random | "ignore" | "force"
}

export interface Result {
  formation: Denco[]
  event: SkillTriggerEvent[]
}

export function evaluateAfterAccess(result: access.AccessResult, self: access.ActiveSkillDenco, probability?: ProbabilityPercent): access.AccessResult {
  const e = result.event[0]
  if (e.type !== "access") {
    throw Error("result.event[0] is not access-event")
  }
  const a = e.data
  const state: SkillEventState = {
    log: a.log,
    formation: getFormation(a, self.which).map(d => {
      return {
        denco: d.denco,
        who: d.carIndex === self.carIndex ? "self" : "other",
        carIndex: d.carIndex,
        skillInvalidated: d.skillInvalidated
      }
    }),
    carIndex: self.carIndex,
    triggeredSkills: [],
    probability: probability,
    probabilityBoostPercent: 0,
    random: a.random,
  }
  const events = execute(state)
  result.event.push(...events)
  return result
}

function getFormation(state: access.AccessState, which: access.AccessSide): access.DencoState[] {
  if (which === "offense") {
    return state.offense.formation
  } else {
    const d = state.defense
    if (!d) throw Error("no defense found")
    return d.formation
  }
}


function execute(state: SkillEventState): SkillTriggerEvent[] {
  state.log.log(`スキル評価イベントの開始`)
  const self = state.formation[state.carIndex]
  if ( !isSkillActive(self.denco.skill)) {
    state.log.error(`アクティブなスキルを保持していません ${self.denco.name}`)
    throw Error("no active skill found")
  }

  const skill = self.denco.skill.skill
  state.log.log(`${self.denco.name} ${skill.name}`)

  // 主体となるスキルとは別に事前に発動するスキル
  const others = state.formation.filter(s => {
    return isSkillActive(s.denco.skill) && !s.skillInvalidated && s.carIndex !== self.carIndex
  })
  others.forEach(s => {
    const skill = s.denco.skill.skill as Skill
    const d: ActiveSkillDenco = {
      ...s,
      propertyReader: skill.propertyReader,
      skill: skill,
    }
    const next = skill.evaluateOnEvent ? skill.evaluateOnEvent(state, d) : undefined
    if (next) {
      state = next
      state.triggeredSkills.push(s.denco)
    }
  })

  // 発動確率の確認
  if ( !canSkillEvaluated(state) ) {
    state.log.log("スキル評価イベントの終了（発動なし）")
    return []
  }

  // 主体となるスキルの発動
  const logic = skill.evaluateOnEvent
  if (!logic){
    state.log.error(`スキル処理がありません ${self.denco.name}`)
    throw Error("no evaluation function found")
  }
  const d: ActiveSkillDenco = {
    ...self,
    skill: skill,
    propertyReader: skill.propertyReader
  }
  const result = logic(state, d)
  if ( !result ) {
    state.log.error("スキル評価が実行されませんでした")
    throw Error("skill not evaluated")
  }
  result.triggeredSkills.push(self.denco)
  

  return result.triggeredSkills.map( d => {
    const e: SkillTriggerEvent = {
      type: "skill_trigger",
      data: d
    }
    return e
  })
}

function canSkillEvaluated(state: SkillEventState) : boolean {
  if ( state.probability) {
    if ( state.random === "force") {
      state.log.log("確率計算は無視されます mode: force")
      return true
    }
    if (state.random === "ignore") {
      state.log.log("確率計算は無視されます mode: ignore")
      return false
    }
    const percent = state.probability
    const boost = state.probabilityBoostPercent
    if ( percent >= 100 ) {
      return true
    }
    if ( state.random() < (percent * (1.0 + boost / 100.0)) / 100.0){
      state.log.log(`スキルが発動できます 確率:${percent}%`)
      return true
    }
    state.log.log(`スキルが発動しませんでした 確率:${percent}%`)
    return false
  } else {
    return true
  }
}

