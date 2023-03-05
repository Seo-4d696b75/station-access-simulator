import dayjs from "dayjs";
import { isWeekendOrHoliday } from "../core/date";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "auto-condition",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  },
  canActivated: (context, state, self) => {
    if (isWeekendOrHoliday(context.currentTime)) return false
    const hour = dayjs.tz(context.currentTime).hour()
    return 10 <= hour && hour < 17
  },
}

export default skill