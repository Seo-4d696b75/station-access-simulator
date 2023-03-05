import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamageFixed: (context, state, self) => {
    if (self.which === "defense") {
      // アクセス・被アクセスでんこの属性に依存
      const offense = getAccessDenco(state, "offense")
      const defense = getAccessDenco(state, "defense")
      if (offense.attr === defense.attr) {
        return {
          probability: self.skill.property.readNumber("probability"),
          type: "damage_fixed",
          damage: self.skill.property.readNumber("damage_fixed")
        }
      }
    }
  }
}

export default skill