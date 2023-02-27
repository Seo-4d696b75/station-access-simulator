import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.which === "defense") {
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_def",
        percent: self.skill.property.readNumber("DEF")
      }
    }
  }
}

export default skill