import moment from "moment-timezone";
import { isWeekendOrHoliday } from "../core/date";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "auto-condition",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense") {
      return {
        probability: self.skill.property.readNumber("probability"),
        recipe: (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`私は平日の「お仕事タイム」にたくさん頑張ってます ATK+${atk}%`)
        }
      }
    }
  },
  canActivated: (context, state, self) => {
    if (isWeekendOrHoliday(context.currentTime)) return false
    const hour = moment(context.currentTime).hour()
    return 10 <= hour && hour < 17
  },
}

export default skill