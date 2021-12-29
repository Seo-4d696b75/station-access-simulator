import { AccessSide, AccessState, ActiveSkillDenco } from "../core/access"
import { SkillEvaluationStep, SkillLogic, SkillTrigger } from "../core/skill"

const skill : SkillLogic = {
  can_evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return step === SkillEvaluationStep.DAMAGE_COMMON && self.which === AccessSide.OFFENSE
  },
  evaluate:(state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    state.attack_percent += 10
    return state
  }
}

export default skill