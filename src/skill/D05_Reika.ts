import { getCurrentTime } from "../core/context"
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return step === "damage_common" && self.which === "offense"
  },
  evaluate: (context, state, step, self) => {
    const atk = self.skill.propertyReader("ATK")
    state.attackPercent += atk
    context.log.log(`べ、別にあんたの為じゃないんだからね！ ATK+${atk}%`)
    return state
  },
  disactivateAt: (context, state, self) => {
    const active = self.skill.propertyReader("active")
    const wait = self.skill.propertyReader("wait")
    const now = getCurrentTime(context)
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000
    }
  }
}

export default skill