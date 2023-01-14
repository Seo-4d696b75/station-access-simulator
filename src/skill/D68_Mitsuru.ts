import { getAccessDenco } from "../core/access";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense") {
      return {
        probability: "probability",
        recipe: (state) => {
          const atkBase = self.skill.property.readNumber("ATK")
          const atkAdditional = self.skill.property.readNumber("ATK_additional")
          // 相手の現在HPに依存
          const d = getAccessDenco(state, "defense")
          const atk = (d.currentHp === d.maxHp) ? atkBase + atkAdditional : atkBase
          state.attackPercent += atk
          context.log.log(`私、優秀でしょう？ ATK${formatPercent(atk)}`)
        }
      }
    }
  }
}

export default skill