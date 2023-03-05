import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      let atk = self.skill.property.readNumber("ATK")
      if (getAccessDenco(state, "defense").attr === "eco") {
        atk += self.skill.property.readNumber("ATK_eco")
      }
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_atk",
        percent: atk
      }
    }
  }
}

export default skill