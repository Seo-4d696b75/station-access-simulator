import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if(self.who === "offense"){
      const lower = self.skill.property.readNumber("ATK_lower")
      const upper = self.skill.property.readNumber("ATK_upper")
      const atk = lower + Math.floor((upper - lower) * context.random())
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_atk",
        percent: atk
      }
    }
  }
}

export default skill