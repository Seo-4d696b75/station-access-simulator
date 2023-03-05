import dayjs from "dayjs"
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      const hour = dayjs.tz(context.currentTime).hour()
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_def",
        percent: (hour < 6 || hour >= 18)
          ? self.skill.property.readNumber("DEF_night")
          : self.skill.property.readNumber("DEF_morning")
      }
    }
  }
}

export default skill