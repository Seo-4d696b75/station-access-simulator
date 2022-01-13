import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return step === "damage_common" &&
      self.who === "defense"
  },
  evaluate: (context, state, step, self) => {
    const hour = new Date().getHours()
    if (hour < 6 || hour >= 18) {
      const def = self.skillPropertyReader("DEF_night")
      state.defendPercent += def
      context.log.log(`夜はこれからなんよ～ DEF+${def}%`)
    } else {
      const def = self.skillPropertyReader("DEF_morning")
      state.defendPercent += def
      context.log.log(`まだ眠いんよ～ DEF${def}%`)
    }
    return state
  }
}

export default skill