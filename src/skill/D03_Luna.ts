import { AccessState, ActiveSkillDenco, SkillEvaluationStep } from "../core/access"
import { SkillLogic, SkillTrigger } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return step === "damage_common" &&
      self.who === "defense"
  },
  evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    const hour = new Date().getHours()
    if (hour < 6 || hour >= 18) {
      const def = self.propertyReader("DEF_night")
      state.defendPercent += def
      state.log.log(`夜はこれからなんよ～ DEF+${def}%`)
    } else {
      const def = self.propertyReader("DEF_morning")
      state.defendPercent += def
      state.log.log(`まだ眠いんよ～ DEF${def}%`)
    }
    return state
  }
}

export default skill