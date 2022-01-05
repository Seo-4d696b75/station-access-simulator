import { AccessState, ActiveSkillDenco, SkillEvaluationStep } from "../core/access"
import { SkillLogic, SkillTrigger } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return false
  }
}

export default skill