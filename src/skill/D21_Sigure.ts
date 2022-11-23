import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" &&
      self.which === "defense" &&
      self.who !== "defense" &&
      state.defense) {
      const defense = state.defense.formation[state.defense.carIndex]
      if (defense.type === "attacker") {
        return {
          probabilityKey: "probability",
          recipe: (state) => {
            const def = self.skill.property.readNumber("DEF")
            state.defendPercent += def
            context.log.log(`わたしのスキルはアタッカーさんの受けるダメージを軽減します DEF+${def}%`)
          },
        }
      }
    }
  }
}

export default skill