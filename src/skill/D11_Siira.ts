import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_def",
        percent: self.skill.property.readNumber("DEF")
      }
    }
  }
}

export default skill