import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
    canEvaluate: (context, state, step, self) => {
        if (step === "damage_common" &&
            self.which === "defense" &&
            self.who !== "defense" &&
            state.defense) {
            const defense = state.defense.formation[state.defense.carIndex]
            if (defense.type === "attacker") {
                return self.skill.propertyReader("probability")
            }
        }
        return false
    },
    evaluate: (context, state, step, self) => {
        const def = self.skill.propertyReader("DEF")
        state.defendPercent += def
        context.log.log(`わたしのスキルはアタッカーさんの受けるダメージを軽減します DEF+${def}%`)
        return state
    }
}

export default skill