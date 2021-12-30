import { AccessState, ActiveSkillDenco } from "../core/access"
import { SkillEvaluationStep, SkillLogic, SkillTrigger } from "../core/skill"

const skill: SkillLogic = {
  can_evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return step === "damage_common" && self.which === "offense"
  },
  evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    const atk = self.property_reader("ATK")
    state.attack_percent += atk
    state.log.log(`仕方ないわね ATK+${atk}%`)
    return state
  }
}

export default skill