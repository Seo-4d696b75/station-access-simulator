import { SkillLogic } from "..";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (
      self.who === "offense"
      && self.currentHp > 1
    ) {
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK"),
        sideEffect: (state) => {
          // HPの半減はダメージとしては記録せずHPを直接操作する
          const d = state.offense.formation[self.carIndex]
          const currentHP = d.currentHp
          const nextHP = Math.floor(currentHP / 2)
          d.currentHp = nextHP
        }
      }
    }
  }
}

export default skill