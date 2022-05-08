import { getCurrentTime } from ".."
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return step === "damage_common" && self.which === "defense"
  },
  evaluate: (context, state, step, self) => {
    const def = self.skill.property.readNumber("DEF")
    state.defendPercent += def
    context.log.log(`わたしのスキルは編成内のでんこ達の受けるダメージを減らすものだー DEF+${def}%`)
    return state
  },
  deactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = getCurrentTime(context)
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000
    }
  }
}

export default skill