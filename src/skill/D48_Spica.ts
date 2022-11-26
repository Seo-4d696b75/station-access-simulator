import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "defense") {
      const targetIdx = self.carIndex === 0 ? 1 : 0
      const d = getAccessDenco(state, "defense")
      if (d.carIndex === targetIdx) {
        return {
          probabilityKey: "probability",
          recipe: (state) => {
            const def = self.skill.property.readNumber("DEF")
            state.defendPercent += def
            context.log.log(`私のスキルは先頭の子のダメージを軽減すること…… DEF+${def}%`)
          }
        }
      }
    }
  }
}

export default skill