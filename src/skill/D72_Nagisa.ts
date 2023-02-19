import { countDencoOf } from "../core/denco";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamageFixed: (context, state, self) => {
    if (self.who === "offense") {
      const count = countDencoOf(
        (d) => d.attr === "cool",
        state.offense,
        state.defense,
      )
      const maxCount = self.skill.property.readNumber("max_count")
      const maxDamage = self.skill.property.readNumber("max_damage")
      const damage = Math.floor(maxDamage * Math.pow(count / maxCount, 2))
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_fixed",
        damage: damage,
      }
    }
  }
}

export default skill