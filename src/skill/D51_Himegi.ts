import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    // DEFアップ
    if (self.which === "defense") {
      // ディフェンダーの数
      const cnt = getDefense(state).formation.filter(d => d.type === "defender").length
      if (cnt > 0) {
        const unit = self.skill.property.readNumber("DEF")
        const def = unit * cnt
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "damage_def",
          percent: def
        }
      }
    }
    // ATKアップ
    if (self.which === "offense") {
      // アタッカーの数
      const cnt = state.offense.formation.filter(d => d.type === "attacker").length
      if (cnt > 0) {
        const unit = self.skill.property.readNumber("ATK")
        const atk = unit * cnt
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "damage_atk",
          percent: atk
        }
      }
    }
  },
}

export default skill