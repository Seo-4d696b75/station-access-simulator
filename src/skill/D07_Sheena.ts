import { counterAttack } from "../core/access"
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    // リブートしていない、かつリンク保持継続している
    if (step === "after_damage" &&
      self.who === "defense" &&
      !self.reboot &&
      !state.linkDisconncted) {
      return self.skill.propertyReader("probability")
    }
    return false
  },
  evaluate: (context, state, step, self) => {
    context.log.log(`あら、誰か来たみたい♪ カウンター攻撃`)
    return counterAttack(context, state, self)
  }
}

export default skill