import dayjs from "dayjs";
import { isWeekendOrHoliday } from "../core/date";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "auto-condition",
  canActivated: (context, state, self) => {
    if (isWeekendOrHoliday(context.currentTime)) return false
    const hour = dayjs.tz(context.currentTime).hour()
    return (7 <= hour && hour < 10) || (17 <= hour && hour < 20)
  },
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "offense") {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`私、でんこのお仕事が大好きなんです ATK${formatPercent(atk)}`)
        }
      }
    }
  }
}

export default skill