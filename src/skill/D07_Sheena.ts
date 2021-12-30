import { AccessState, ActiveSkillDenco, counterAttack } from "../core/access"
import { SkillEvaluationStep, SkillLogic, SkillTrigger } from "../core/skill"

const skill: SkillLogic = {
  can_evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    // リブートしていない、かつリンク保持継続している
    if (step === "after_damage" &&
      self.who === "defense" &&
      !self.reboot &&
      !state.link_disconneted) {
      return self.property_reader("probability")
    }
    return false
  },
  evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    state.log.log(`あら、誰か来たみたい♪ カウンター攻撃`)
    return counterAttack(state, self.denco)
  }
}

export default skill