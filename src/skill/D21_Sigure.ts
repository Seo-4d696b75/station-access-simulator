import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" &&
      self.which === "defense" &&
      self.who !== "defense" &&
      state.defense) {
      const defense = state.defense.formation[state.defense.carIndex]
      if (defense.type === "attacker") {
        return {
          probability: self.skill.property.readNumber("probability"),
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