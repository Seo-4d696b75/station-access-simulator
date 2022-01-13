import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return step === "damage_common" && self.which === "offense"
  },
  evaluate: (context, state, step, self) => {
    const atk = self.skillPropertyReader("ATK")
    state.attackPercent += atk
    context.log.log(`べ、別にあんたの為じゃないんだからね！ ATK+${atk}%`)
    return state
  }
}

export default skill