import { isWeekendOrHoliday } from '../core/date';
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "auto-condition",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_def",
        percent: self.skill.property.readNumber("DEF")
      }
    }
  },
  canActivated: (context, state, self) => {
    // 土日または日本の祝日
    return isWeekendOrHoliday(context.currentTime)
  }
}

export default skill