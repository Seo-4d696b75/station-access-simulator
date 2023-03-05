import { getAccessDenco, hasSkillTriggered } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessStart: (context, state, self) => {
    // 自身のアクセスは対象外
    if (self.which === "offense" && self.who !== "offense") {
      const d = getAccessDenco(state, "offense")
      if (d.attr === state.station.attr) {
        const exp = self.skill.property.readNumber("EXP")
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "exp_delivery",
          exp: (d) => d.who === "defense" ? exp : 0,
        }
      }
    }
  },
  onAccessDamageFixed: (context, state, self) => {
    // 経験値追加と同時
    if (hasSkillTriggered(state, "offense", self)) {
      return {
        probability: 100,
        type: "damage_fixed",
        damage: self.skill.property.readNumber("damage_fixed")
      }
    }
  }
}

export default skill