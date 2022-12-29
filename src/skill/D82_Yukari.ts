import { getAccessDenco } from "../core/access";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (
      step === "damage_common"
      && self.which === "defense"
      && state.defense
    ) {
      const targetIdx = (self.carIndex === 0) ? 1 : 0
      const d = getAccessDenco(state, "defense")
      const triggerTop = (targetIdx === d.carIndex)
      const ecoCnt = state.defense
        .formation
        .filter(d => d.attr === "eco")
        .length
      const triggerEco = d.attr === "eco"
        && ecoCnt >= self.skill.property.readNumber("eco_count")
      if (triggerTop || triggerEco) {
        return {
          probabilityKey: "probability", // 100%
          recipe: (state) => {
            context.log.log("一歩退いて皆さんのお手伝いをさせていただければと……♡")
            let def = 0
            if (triggerTop) {
              const value = self.skill.property.readNumber("DEF")
              def += value
              context.log.log(`  先頭 DEF${formatPercent(value)}`)
            }
            if (triggerEco) {
              const value = self.skill.property.readNumber("DEF_eco")
              def += value
              context.log.log(`  eco x ${ecoCnt} DEF${formatPercent(value)}`)
            }
            state.defendPercent += def
          }
        }
      }
    }
  }
}

export default skill