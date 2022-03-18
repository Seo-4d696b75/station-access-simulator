import { getCurrentTime } from "../core/context";
import { isSkillActive, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    if (step === "before_access") {
      let all = Array.from(state.offense.formation)
      if (state.defense) {
        all.push(...state.defense.formation)
      }
      let anySupporter = all.some(d => {
        return d.type === "supporter" && isSkillActive(d.skill) && !d.skillInvalidated
      })
      return anySupporter && self.skill.property.readNumber("probability")
    }
    return false
  },
  evaluate: (context, state, step, self) => {
    let all = Array.from(state.offense.formation)
    if (state.defense) {
      all.push(...state.defense.formation)
    }
    let target = all.filter(d => d.type === "supporter" && isSkillActive(d.skill))
    let names = target.map(d => d.name).join(",")
    target.forEach(d => d.skillInvalidated = true)
    context.log.log(`サポーターのスキルも何のその、ですよ♪ 無効化：${names}`)
    return state
  },
  disactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = getCurrentTime(context)
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000
    }
  }
}

export default skill