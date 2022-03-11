import { isSkillActive, SkillLogic } from "../core/skill";
import { evaluateSkillAtEvent, SkillEventEvaluate } from "../core/skillEvent";

const skill: SkillLogic = {
  canActivated: (context, state, self) => {
    const idx = state.formation.findIndex(d => d.currentHp < d.maxHp)
    return idx >= 0
  },
  onHourCycle: (context, state, self) => {
    if (isSkillActive(self.skill)) {
      return evaluateSkillAtEvent(context, state, self, true, evaluate)
    } else {
      return state
    }
  }
}

const evaluate: SkillEventEvaluate = (context, state, self) => {
  const heal = self.skill.property.readNumber("heal")
  context.log.log(`編成内のみなさまのHPを回復いたしますよ♪ +${heal}%`)
  state.formation.forEach( d => {
    if ( d.currentHp < d.maxHp){
      const v = Math.min(Math.floor(d.currentHp + d.maxHp * heal / 100.0), d.maxHp)
      context.log.log(`HPの回復 ${d.name} ${d.currentHp} > ${v}`)
      d.currentHp = v
    }
  })
  return state
}

export default skill