import { getAccessDenco } from "../core/access";
import { countDencoOf } from "../core/denco";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.which === "defense") {
      let def = 0
      const targetIdx = (self.carIndex === 0) ? 1 : 0
      const d = getAccessDenco(state, "defense")
      if (d.carIndex === targetIdx) {
        def += self.skill.property.readNumber("DEF")
      }
      const ecoCnt = countDencoOf(
        (d) => d.attr === "eco",
        state.defense
      )
      if (
        d.attr === "eco"
        && ecoCnt >= self.skill.property.readNumber("eco_count")
      ) {
        def += self.skill.property.readNumber("DEF_eco")
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