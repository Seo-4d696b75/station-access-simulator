import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      return {
        probabilityKey: "probability",
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