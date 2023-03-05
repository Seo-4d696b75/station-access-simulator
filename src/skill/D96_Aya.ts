import { countDencoOf } from "../core/denco";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (
      self.which === "offense"
      && self.who === "other"
    ) {
      const count = countDencoOf(
        (d) => d.skill.type === "possess" && d.skill.transitionType === "always",
        state.defense,
      )
      if (count === 0) return
      const countMax = self.skill.property.readNumber("active_count_max")
      const atkMax = self.skill.property.readNumber("ATK_max")
      const atk = Math.floor(atkMax * Math.pow(Math.min(count, countMax) / countMax, 2) * 100) / 100
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_atk",
        percent: atk
      }
    }
  }
}

export default skill