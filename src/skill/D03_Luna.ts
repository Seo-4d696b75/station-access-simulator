import { getCurrentTime } from "../core/context"
import { SkillLogic } from "../core/skill"
import moment from "moment-timezone"

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return step === "damage_common" &&
      self.who === "defense"
  },
  evaluate: (context, state, step, self) => {
    const hour = moment(getCurrentTime(context)).hour()
    if (hour < 6 || hour >= 18) {
      const def = self.skill.property.readNumber("DEF_night")
      state.defendPercent += def
      context.log.log(`夜はこれからなんよ～ DEF+${def}%`)
    } else {
      const def = self.skill.property.readNumber("DEF_morning")
      state.defendPercent += def
      context.log.log(`まだ眠いんよ～ DEF${def}%`)
    }
    return state
  }
}

export default skill