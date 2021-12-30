import { AccessState, ActiveSkillDenco } from "../core/access"
import { SkillEvaluationStep, SkillLogic, SkillTrigger } from "../core/skill"

const skill: SkillLogic = {
  can_evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return step === "damage_common" && self.which === "defense"
  },
  evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    const def = self.property_reader("DEF")
    state.defend_percent += def
    state.log.log(`まだまだこんなもんじゃないゾー DEF+${def}%`)
    return state
  }
}

export default skill