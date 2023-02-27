import { countDencoOf } from "../core/denco";
import { isSkillActive, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      const activeCnt = countDencoOf(
        (d) => isSkillActive(d.skill),
        state.offense,
      )
      return {
        probability: self.skill.property.readNumber("probability"), // 100%
        type: "damage_def",
        percent: self.skill.property.readNumber("DEF") + (
          activeCnt >= 4
            ? self.skill.property.readNumber("DEF_additional")
            : 0
        )
      }
    }
  }
}

export default skill