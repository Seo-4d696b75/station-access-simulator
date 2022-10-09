import { counterAttack } from "../core/access"
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    // リブートしていない、かつリンク保持継続している
    if (step === "after_damage" &&
      self.who === "defense" &&
      !self.reboot &&
      !state.linkDisconnected) {
      return {
        probability: self.skill.property.readNumber("probability"),
        recipe: (state) => {
          context.log.log(`あら、誰か来たみたい♪ カウンター攻撃`)
          return counterAttack(context, state, self)
        }
      }
    }
  }
}

export default skill