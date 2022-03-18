import { AccessDencoState, getDefense } from "../core/access";
import { isSkillActive, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    if (step === "before_access" && self.who === "offense" && state.defense) {
      let all = [
        ...state.offense.formation,
        ...getDefense(state).formation
      ]
      let anySupporter = all.some(d => {
        return d.type === "supporter" && isSkillActive(d.skill) && !d.skillInvalidated
      })
      return anySupporter && self.skill.property.readNumber("probability")
    }
    return false
  },
  evaluate: (context, state, step, self) => {
    let all = [
      ...state.offense.formation,
      ...getDefense(state).formation
    ]
    let target = all.filter(d => d.type === "supporter" && isSkillActive(d.skill))
    let names = target.map(d => d.name).join(",")
    target.forEach(d => d.skillInvalidated = true)
    context.log.log(`ハルはひとりで大丈夫だもん！！ 無効化：${names}`)
    return state
  }
}

export default skill