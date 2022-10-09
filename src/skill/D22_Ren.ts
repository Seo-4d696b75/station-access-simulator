import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";


const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "before_access" && self.who === "offense" && state.defense) {
      const defense = getAccessDenco(state, "defense")
      const target = self.skill.property.readStringArray("invalidated")
      if (target.includes(defense.numbering)) {
        return (state) => {
          const defense = getAccessDenco(state, "defense")
          defense.skillInvalidated = true
          context.log.log(`ウチのスキルは相手のスキルを無効化するでぇー target:${defense.name}`)
        }
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