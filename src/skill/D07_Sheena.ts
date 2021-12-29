import { AccessState, ActiveSkillDenco } from "../core/access"
import { SkillEvaluationStep, SkillLogic, SkillTrigger } from "../core/skill"

const skill : SkillLogic = {
  can_evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    // リブートしていない、かつリンク保持継続している
    return step === "after_damage" && 
      self.who === "defense" &&
      !self.reboot &&
      !state.link_disconneted
  },
  evaluate:(state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    state.attack_percent += self.property_reader("ATK")
    return state
  }
}

export default skill