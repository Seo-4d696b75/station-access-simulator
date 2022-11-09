import moment from "moment-timezone";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common") {
      const hour = moment(context.currentTime).hour()
      const night = hour < 6 || hour >= 18
      if (night && self.who === "offense") {
        return (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`本当のレーノは夜になってからのお・た・の・し・み♪ ATK+${atk}%`)
        }
      } else if (!night && self.who === "defense") {
        return (state) => {
          const def = self.skill.property.readNumber("DEF")
          state.defendPercent += def
          context.log.log(`はぁぁぁ…もう朝…？レーノはおひさまが嫌いなの。DEF${def}%`)
        }
      }
    }
  }
}

export default skill