import { countDencoOf } from "../core/denco";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.which === "defense") {
      // 自身を除くecoの数
      const count = countDencoOf(
        d => d.numbering !== self.numbering && d.attr === "eco",
        state.defense,
      )
      let def = 0
      // 自身効果
      if (count > 0 && self.who === "defense") {
        const maxCount = self.skill.property.readNumber("count_self_max")
        const maxDef = self.skill.property.readNumber("DEF_self_max")
        def += maxDef * Math.min(count, maxCount) / maxCount
      }
      // 編成内効果
      if (count >= self.skill.property.readNumber("count_other")) {
        def += self.skill.property.readNumber("DEF_other")
      }
      if (def > 0) {
        return {
          probability: self.skill.property.readNumber("probability"),
          type: "damage_def",
          percent: def
        }
      }
    }
  },
}

export default skill