import { formatPercent } from "../core/format";
import { isSkillActive, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      return {
        probability: "probability", // 100%
        recipe: (state) => {
          let def = self.skill.property.readNumber("DEF")
          const activeCnt = state.offense.formation
            .filter(d => isSkillActive(d.skill))
            .length
          if (activeCnt >= 4) {
            def += self.skill.property.readNumber("DEF_additional")
          }
          state.defendPercent += def
          context.log.log(`ヘコんでないで楽しくいこー！DEF${formatPercent(def)}`)
        }
      }
    }
  }
}

export default skill