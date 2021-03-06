import { getCurrentTime, SkillLogic } from "..";

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return step === "damage_common" &&
      self.who === "offense" &&
      !!state.defense &&
      self.currentHp > 1
  },
  evaluate: (context, state, step, self) => {
    const atk = self.skill.property.readNumber("ATK")
    state.attackPercent += atk
    // HPの半減はダメージとしては記録せずHPを直接操作する
    const d = state.offense.formation[self.carIndex]
    const currentHP = d.currentHp
    const nextHP = Math.floor(currentHP / 2)
    d.currentHp = nextHP
    context.log.log(`イムラ推して参る ATK+${atk}% HP:${currentHP}->${nextHP}`)
    return state
  },
  disactivateAt: (context, state, self) => {
    const now = getCurrentTime(context)
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000
    }
  }
}

export default skill