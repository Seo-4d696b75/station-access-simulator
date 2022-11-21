import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense") {
      // 編成内のアタッカーの数
      const cnt = state.offense.formation.filter(d => d.type === "attacker").length
      if (cnt > 0) {
        return {
          probability: self.skill.property.readNumber("probability"),
          recipe: (state) => {
            const atk = cnt * self.skill.property.readNumber("ATK")
            state.attackPercent += atk
            context.log.log(`ワタシがどれだけ頑張れるかは編成にかかってるわ ATK+${atk}%`)
          }
        }
      }
    }
    if (step === "damage_common" && self.who === "defense") {
      // 編成内のディフェンダーの数
      const cnt = getDefense(state).formation.filter(d => d.type === "defender").length
      if (cnt > 0) {
        return {
          probability: self.skill.property.readNumber("probability"),
          recipe: (state) => {
            const def = cnt * self.skill.property.readNumber("DEF")
            state.defendPercent += def
            context.log.log(`ワタシがどれだけ頑張れるかは編成にかかってるわ DEF+${def}%`)
          }
        }
      }
    }
  }
}

export default skill