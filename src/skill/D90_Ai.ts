import { getAccessDenco } from "../core/access";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    // 自身を除く編成内のcool属性をDEF増加
    if (
      step === "damage_common"
      && self.which === "defense"
      && self.who !== "defense"
      && getAccessDenco(state, "defense").attr === "cool"
    ) {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          let def = self.skill.property.readNumber("DEF")
          // 相手編成がすべてheat
          const allHeat = state.offense.formation.every(d => d.attr === "heat")
          if (allHeat) {
            def += self.skill.property.readNumber("DEF_heat")
          }
          state.defendPercent += def
          context.log.log(`ほかのでんこをサポートするのが得意なんだっ！ DEF${formatPercent(def)}`)
        }
      }
    }
  }
}

export default skill