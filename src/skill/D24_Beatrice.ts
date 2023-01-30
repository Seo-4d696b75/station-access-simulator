import { getAccessDenco } from "../core/access/index";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      const offense = getAccessDenco(state, "offense")
      if (offense.ap > self.ap) {
        const maxDEF = self.skill.property.readNumber("DEF")
        const def = Math.floor(maxDEF * (offense.ap - self.ap) / offense.ap)
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "damage_def",
          percent: def,
        }
      }
    }
  }
}

export default skill