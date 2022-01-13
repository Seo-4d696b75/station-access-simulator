import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return step === "damage_common" && self.which === "defense"
  },
  evaluate: (context, state, step, self) => {
    const def = self.skillPropertyReader("DEF")
    state.defendPercent += def
    context.log.log(`まだまだこんなもんじゃないゾー DEF+${def}%`)
    return state
  }
}

export default skill