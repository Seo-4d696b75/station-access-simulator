import dayjs from "dayjs";
import { isWeekendOrHoliday } from "../core/date";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "auto-condition",
  canActivated: (context, state, self) => {
    if (isWeekendOrHoliday(context.currentTime)) return false
    const hour = dayjs.tz(context.currentTime).hour()
    return (7 <= hour && hour < 10) || (17 <= hour && hour < 20)
  },
  onAccessDamagePercent: (context, state, self) => {
    if (self.which === "offense") {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  }
}

export default skill