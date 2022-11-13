import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    // DEFアップ
    if (step === "damage_common" && self.which === "defense") {
      // ディフェンダーの数
      const cnt = getDefense(state).formation.filter(d => d.type === "defender").length
      if (cnt > 0) {
        return (state) => {
          const unit = self.skill.property.readNumber("DEF")
          const def = unit * cnt
          state.defendPercent += def
          context.log.log(`編成に合わせてみんなを手助けしちゃうよー DEF+${def}%`)
        }
      }
    }
    // ATKアップ
    if (step === "damage_common" && self.which === "offense" && state.defense) {
      // アタッカーの数
      const cnt = state.offense.formation.filter(d => d.type === "attacker").length
      if (cnt > 0) {
        return (state) => {
          const unit = self.skill.property.readNumber("ATK")
          const atk = unit * cnt
          state.attackPercent += atk
          context.log.log(`編成に合わせてみんなを手助けしちゃうよー ATK+${atk}%`)
        }
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