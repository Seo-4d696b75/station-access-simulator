import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "offense" && state.defense) {
      const targetIdx = self.carIndex === 0 ? 1 : 0
      const d = getAccessDenco(state, "offense")
      if (d.carIndex === targetIdx) {
        return (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`マスター、あとちょっとだけ頑張ってリンクしてみよ♪ ATK+${atk}%`)
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