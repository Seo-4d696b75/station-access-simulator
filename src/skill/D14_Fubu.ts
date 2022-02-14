import { getCurrentTime } from ".."
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return step === "damage_common" && self.which === "defense"
  },
  evaluate: (context, state, step, self) => {
    const def = self.skill.propertyReader("DEF")
    state.defendPercent += def
    context.log.log(`わたしのスキルは編成内のでんこ達の受けるダメージを減らすものだー DEF+${def}%`)
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