import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "defense") {
      return (state) => {
        const def = self.skill.property.readNumber("DEF")
        state.defendPercent += def
        context.log.log(`わたしのスキルは編成内のでんこ達の受けるダメージを減らすものだー DEF+${def}%`)
      }
    }
  },
  deactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = context.currentTime
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000
    }
  }
}

export default skill