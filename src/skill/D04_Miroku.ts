import { getAccessDenco, hasSkillTriggered, repeatAccess } from "../core/access/index";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessAfterDamage: (context, state, self) => {
    // 相手がまだリブートしていない & 自身のスキルがまだ発動していない
    if (self.who === "offense" && state.defense && !state.pinkMode) {
      const d = getAccessDenco(state, "defense")
      if (!d.reboot && !hasSkillTriggered(state, "offense", self)) {
        return {
          probability: self.skill.property.readNumber("probability"),
          type: "after_recipe",
          recipe: (state) => repeatAccess(context, state)
        }
      }
    }
  }
}

export default skill