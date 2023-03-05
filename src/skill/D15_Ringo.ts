import dayjs from "dayjs"
import { SkillLogic } from ".."

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    const hour = dayjs.tz(context.currentTime).hour()
    if ((hour < 6 || hour >= 18) && self.who === "defense") {
      return {
        probability: self.skill.property.readNumber("probability_def", 100),
        type: "damage_def",
        percent: self.skill.property.readNumber("DEF")
      }
    }
    if ((6 <= hour && hour < 18) && self.who === "offense") {
      return {
        probability: self.skill.property.readNumber("probability_atk", 100),
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  }
}

export default skill