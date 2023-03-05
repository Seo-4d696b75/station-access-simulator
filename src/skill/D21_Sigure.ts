import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (
      self.which === "defense"
      && self.who !== "defense"
      && state.defense
    ) {
      const defense = state.defense.formation[state.defense.carIndex]
      if (defense.type === "attacker") {
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "damage_def",
          percent: self.skill.property.readNumber("DEF"),
        }
      }

    }
  }
}

export default skill