import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "defense") {
      const targetIdx = self.carIndex === 0 ? 1 : 0
      const d = getAccessDenco(state, "defense")
      if (d.carIndex === targetIdx) {
        return {
          probability: self.skill.property.readNumber("probability"),
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