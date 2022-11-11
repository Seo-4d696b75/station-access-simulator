import { getAccessDenco } from "../core/access/index";
import { SkillLogic } from "../core/skill";


const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    // FIXME 足湯では発動しない
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