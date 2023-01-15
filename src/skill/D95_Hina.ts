import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    // 自身・相手編成の全員が対象
    if (step === "damage_common") {
      return {
        probability: "probability",
        recipe: (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`ヤバンなことはやめるのよ！ ATK${formatPercent(atk)}`)
        }
      }
    }
  }
}

export default skill