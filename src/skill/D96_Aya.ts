import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (
      step === "damage_common"
      && self.which === "offense"
      && self.who === "other"
    ) {
      const count = state.defense!!
        .formation
        .filter(d => d.skill.type === "possess" && d.skill.transitionType === "always")
        .length
      if (count === 0) return
      return {
        probability: "probability",
        recipe: (state) => {
          const countMax = self.skill.property.readNumber("active_count_max")
          const atkMax = self.skill.property.readNumber("ATK_max")
          const atk = Math.floor(atkMax * Math.pow(Math.min(count, countMax) / countMax, 2) * 100) / 100
          state.attackPercent += atk
          context.log.log(`節約だけは得意なんです! ATK${formatPercent(atk)}`)
        }
      }
    }
  }
}

export default skill