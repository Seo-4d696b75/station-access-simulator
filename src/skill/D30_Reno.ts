import dayjs from "dayjs";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {

    const hour = dayjs.tz(context.currentTime).hour()
    const night = hour < 6 || hour >= 18
    if (night && self.who === "offense") {
      return {
        probability: self.skill.property.readNumber("probability_atk", 100),
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    } else if (!night && self.who === "defense") {
      return {
        probability: self.skill.property.readNumber("probability_def", 100),
        type: "damage_def",
        percent: self.skill.property.readNumber("DEF")
      }
    }
  }
}

export default skill