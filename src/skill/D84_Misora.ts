import { getAccessDenco } from "../core/access";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common") {
      const d = getAccessDenco(state, self.which)
      const target = self.skill.property.readStringArray("target_name")
      const isTarget = target.some(t => d.firstName.includes(t))
      if (isTarget && self.which === "offense") {
        return {
          probabilityKey: "probability", // 100%
          recipe: (state) => {
            const atk = self.skill.property.readNumber("ATK")
            state.attackPercent += atk
            context.log.log(`わたし、音楽のあるおでかけって大好きですっ！ ATK${formatPercent(atk)}`)
          }
        }
      } else if (isTarget && self.which === "defense") {
        return {
          probabilityKey: "probability", // 100%
          recipe: (state) => {
            const def = self.skill.property.readNumber("DEF")
            state.defendPercent += def
            context.log.log(`わたし、音楽のあるおでかけって大好きですっ！ DEF${formatPercent(def)}`)
          }
        }
      }
    }
  }
}

export default skill