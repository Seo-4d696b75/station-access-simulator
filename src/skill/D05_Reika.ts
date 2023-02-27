import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.which === "offense") {
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  }
}

export default skill