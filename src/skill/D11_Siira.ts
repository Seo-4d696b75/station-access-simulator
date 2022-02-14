import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      return self.skill.propertyReader("probability")
    }
    return false
  },
  evaluate: (context, state, step, self) => {
    const def = self.skill.propertyReader("DEF")
    state.defendPercent += def
    context.log.log(`わ、わたしのスキルでアクセスされた時にダメージを軽減できます DEF+${def}%`)
    return state
  }
}

export default skill