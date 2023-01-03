import { getDefense } from "../core/access";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "defense") {
      // 自身を除くecoの数
      const count = getDefense(state)
        .formation
        .filter(d => d.name !== self.name)
        .filter(d => d.attr === "eco")
        .length
      // 自身効果
      const triggerSelf = (count > 0 && self.who === "defense")
      // 編成内効果
      const triggerOther = count >= self.skill.property.readNumber("count_other")
      if (!triggerSelf && !triggerOther) return
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          context.log.log(`雰囲気の近い人たちと一緒だと力が出る、というか……`)
          if (triggerSelf) {
            const maxCount = self.skill.property.readNumber("count_self_max")
            const maxDef = self.skill.property.readNumber("DEF_self_max")
            const def = maxDef * Math.min(count, maxCount) / maxCount
            state.defendPercent += def
            context.log.log(` DEF(自身)${formatPercent(def)}`)
          }
          if (triggerOther) {
            const def = self.skill.property.readNumber("DEF_other")
            state.defendPercent += def
            context.log.log(` DEF(編成内)${formatPercent(def)}`)
          }
        }
      }

    }
  }
}

export default skill