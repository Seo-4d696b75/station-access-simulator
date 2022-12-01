import { getAccessDenco } from "../core/access";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      // 相手がheat属性の場合のみ
      const d = getAccessDenco(state, "offense")
      if (d.attr === "heat") {
        return {
          probabilityKey: "probability",
          recipe: (state) => {
            const def = self.skill.property.readNumber("DEF")
            state.defendPercent += def
            context.log.log(`あんまりアツすぎる子はちょっぴり苦手やわぁ…… DEF${formatPercent(def)}`)
          }
        }
      }
    }
  }
}

export default skill