import { getCurrentTime, SkillLogic } from "..";
import moment from "moment-timezone"

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    if (step === "damage_common") {
      const hour = moment(getCurrentTime(context)).hour()
      if ((hour < 6 || hour >= 18) && self.who === "defense") return true
      if ((6 <= hour && hour < 18) && self.who === "offense") return true
    }
    return false
  },
  evaluate: (context, state, step, self) => {
    const hour = moment(getCurrentTime(context)).hour()
    if ((hour < 6 || hour >= 18) && self.who === "defense") {
      const def = self.skill.property.readNumber("DEF")
      state.defendPercent += def
      context.log.log(`夜更かしはお肌の大敵♪ DEF ${def}%`)
    }
    if ((6 <= hour && hour < 18) && self.who === "offense") {
      const atk = self.skill.property.readNumber("ATK")
      state.attackPercent += atk
      context.log.log(`りんごちゃんは基本日中だけ頑張ります♪ ATK +${atk}%`)
    }
    return state
  }
}

export default skill