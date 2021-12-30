import { AccessState, ActiveSkillDenco } from "../core/access"
import { SkillEvaluationStep, SkillLogic, SkillTrigger } from "../core/skill"

const skill: SkillLogic = {
  can_evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return step === "damage_common" &&
      self.who === "defense"
  },
  evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    const hour = new Date().getHours()
    if (hour < 6 || hour >= 18) {
      const def = self.property_reader("DEF_night")
      state.defend_percent += def
      state.log.log(`夜はこれからなんよ～ DEF+${def}%`)
    } else {
      const def = self.property_reader("DEF_morning")
      state.defend_percent += def
      state.log.log(`まだ眠いんよ～ DEF${def}%`)
    }
    return state
  }
}

export default skill