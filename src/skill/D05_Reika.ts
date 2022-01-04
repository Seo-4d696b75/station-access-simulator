import { AccessState, ActiveSkillDenco } from "../core/access"
import { SkillEvaluationStep, SkillLogic, SkillTrigger } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return step === "damage_common" && self.which === "offense"
  },
  evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    const atk = self.propertyReader("ATK")
    state.attackPercent += atk
    state.log.log(`べ、別にあんたの為じゃないんだからね！ ATK+${atk}%`)
    return state
  }
}

export default skill