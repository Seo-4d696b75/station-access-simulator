import { AccessSide, AccessState, ActiveSkillDenco } from "../core/access"
import { SkillEvaluationStep, SkillLogic, SkillTrigger } from "../core/skill"

const skill : SkillLogic = {
  can_evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return step === "damage_common" && self.which === "offense"
  },
  evaluate:(state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    state.attack_percent += 10
    return state
  }
}

export default skill