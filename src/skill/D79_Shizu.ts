import { countDencoBy, countDencoOf } from "../core/denco";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.which === "offense") {
      const heatCnt = countDencoOf(
        (d) => d.attr === "heat",
        state.offense,
      )
      if (heatCnt !== state.offense.formation.length) return
      const atk = self.skill.property.readNumber("ATK")
      const attrCnt = countDencoBy(
        (d) => d.attr,
        state.defense
      )
      const def = attrCnt * self.skill.property.readNumber("DEF")
      return [
        {
          probability: self.skill.property.readNumber("probability"),
          type: "damage_atk",
          percent: atk
        },
        {
          probability: self.skill.property.readNumber("probability"),
          type: "damage_def",
          percent: def
        }
      ]
    }
  }
}

export default skill