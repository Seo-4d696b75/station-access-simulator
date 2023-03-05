import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      // 編成内のアタッカーの数
      const cnt = state.offense.formation.filter(d => d.type === "attacker").length
      if (cnt > 0) {
        return {
          probability: self.skill.property.readNumber("probability"),
          type: "damage_atk",
          percent: cnt * self.skill.property.readNumber("ATK")
        }
      }
    }
    if (self.who === "defense") {
      // 編成内のディフェンダーの数
      const cnt = getDefense(state).formation.filter(d => d.type === "defender").length
      if (cnt > 0) {
        return {
          probability: self.skill.property.readNumber("probability"),
          type: "damage_def",
          percent: cnt * self.skill.property.readNumber("DEF")
        }
      }
    }
  }
}

export default skill