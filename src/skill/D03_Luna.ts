import { AccessState, ActiveSkillDenco } from "../core/access"
import { SkillEvaluationStep, SkillLogic, SkillTrigger } from "../core/skill"

const skill: SkillLogic = {
  can_evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return step === "damage_common" &&
      self.who === "defense"
  },
  evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    const hour = new Date().getHours()
    if (hour < 6 && hour >= 18) {
      state.defend_percent += self.property_reader("DEF_night")
    } else {
      state.defend_percent += self.property_reader("DEF_morning")
    }
    return state
  }
}

export default skill