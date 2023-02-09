import { counterAttack } from "../core/access/index"
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "always",
  onAccessAfterDamage: (context, state, self) => {
    // リブートしていない、かつリンク保持継続している
    if (
      self.who === "defense"
      && !self.reboot
      && !state.linkDisconnected
    ) {
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "skill_recipe",
        recipe: (state) => counterAttack(context, state, self)
      }
    }
  }
}

export default skill