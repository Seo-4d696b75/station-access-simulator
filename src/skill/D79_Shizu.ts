import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "offense") {
      const heatCnt = state
        .offense
        .formation
        .filter(d => d.attr === "heat")
        .length
      if (heatCnt === state.offense.formation.length) {
        return {
          probability: "probability",
          recipe: (state) => {
            const atk = self.skill.property.readNumber("ATK")
            state.attackPercent += atk
            const defUnit = self.skill.property.readNumber("DEF")
            const attrCnt = new Set(
              state.defense!.formation.map(d => d.attr)
            ).size
            const def = defUnit * attrCnt
            state.defendPercent += def
            context.log.log(`真のテンサイはサポートもうまくなくちゃね。`)
            context.log.log(`  ATK ${formatPercent(atk)}`)
            context.log.log(`  DEF ${formatPercent(def)}(${defUnit} x ${attrCnt})`)
          }
        }
      }
    }
  }
}

export default skill