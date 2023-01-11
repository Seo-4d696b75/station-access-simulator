import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (
      step === "damage_common"
      && self.who === "defense"
      && self.currentHp === self.maxHp
    ) {
      return {
        probabilityKey: "probability", // 100%
        recipe: (state) => {
          const def = self.skill.property.readNumber("DEF")
          state.defendPercent += def
          context.log.log(`わたしは何もしなくとも強い！DEF${formatPercent(def)}`)
        }
      }
    }
  }
}

export default skill