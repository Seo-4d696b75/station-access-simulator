import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      const isHome = getDefense(state).user.isHomeStation(context, state.station)
      if (isHome) {
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "damage_def",
          percent: self.skill.property.readNumber("DEF")
        }
      }
    }
  }
}

export default skill