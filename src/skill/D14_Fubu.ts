import { AccessState, ActiveSkillDenco, SkillEvaluationStep } from "../core/access"
import { SkillLogic, SkillTrigger } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return step === "damage_common" && self.which === "defense"
  },
  evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    const def = self.propertyReader("DEF")
    state.defendPercent += def
    state.log.log(`まだまだこんなもんじゃないゾー DEF+${def}%`)
    return state
  }
}

export default skill