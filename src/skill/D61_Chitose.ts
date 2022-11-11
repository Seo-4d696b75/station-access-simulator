import { isSkillActive, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    // FIXME 足湯では発動しない
    if (step === "before_access" && state.defense) {
      const all = Array.from(state.offense.formation)
      all.push(...state.defense.formation)
      const anySupporter = all.some(d => {
        return d.type === "supporter" && isSkillActive(d.skill) && !d.skillInvalidated
      })
      if (!anySupporter) return // 無効化の対象が存在しない
      return {
        probability: self.skill.property.readNumber("probability"),
        recipe: (state) => {
          const all = Array.from(state.offense.formation)
          if (state.defense) {
            all.push(...state.defense.formation)
          }
          const target = all.filter(d => d.type === "supporter" && isSkillActive(d.skill))
          const names = target.map(d => d.name).join(",")
          target.forEach(d => d.skillInvalidated = true)
          context.log.log(`サポーターのスキルも何のその、ですよ♪ 無効化：${names}`)
        },
      }
    }
  },
  deactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = context.currentTime
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000
    }
  }
}

export default skill