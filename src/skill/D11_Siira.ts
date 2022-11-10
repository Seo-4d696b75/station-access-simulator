import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      return {
        probability: self.skill.property.readNumber("probability"),
        recipe: (state) => {
          const def = self.skill.property.readNumber("DEF")
          state.defendPercent += def
          context.log.log(`わ、わたしのスキルでアクセスされた時にダメージを軽減できます DEF+${def}%`)
        },
      }
    }
  }
}

export default skill