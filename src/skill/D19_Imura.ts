import { SkillLogic } from "..";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common"
      && self.who === "offense"
      && state.defense
      && self.currentHp > 1) {
      return (state) => {
        const atk = self.skill.property.readNumber("ATK")
        state.attackPercent += atk
        // HPの半減はダメージとしては記録せずHPを直接操作する
        const d = state.offense.formation[self.carIndex]
        const currentHP = d.currentHp
        const nextHP = Math.floor(currentHP / 2)
        d.currentHp = nextHP
        context.log.log(`イムラ推して参る ATK+${atk}% HP:${currentHP}->${nextHP}`)
      }
    }
  },
  deactivate: "default_timeout"
}

export default skill