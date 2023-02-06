import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      const atkBase = self.skill.property.readNumber("ATK")
      const atkAdditional = self.skill.property.readNumber("ATK_additional")
      // 相手の現在HPに依存
      const d = getAccessDenco(state, "defense")
      const atk = (d.currentHp === d.maxHp) ? atkBase + atkAdditional : atkBase
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_atk",
        percent: atk,
      }
    }
  }
}

export default skill