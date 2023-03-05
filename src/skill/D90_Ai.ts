import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    // 自身を除く編成内のcool属性をDEF増加
    if (
      self.which === "defense"
      && self.who !== "defense"
      && getAccessDenco(state, "defense").attr === "cool"
    ) {
      const def = self.skill.property.readNumber("DEF") + (
        // 相手編成がすべてheat
        state.offense.formation.every(d => d.attr === "heat")
          ? self.skill.property.readNumber("DEF_heat")
          : 0
      )
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_def",
        percent: def
      }
    }
  }
}

export default skill