import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "offense") {
      return (state) => {
        const atk = self.skill.property.readNumber("ATK")
        state.attackPercent += atk
        context.log.log(`べ、別にあんたの為じゃないんだからね！ ATK+${atk}%`)
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