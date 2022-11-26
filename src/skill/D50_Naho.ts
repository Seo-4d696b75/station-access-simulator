import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          const def = self.skill.property.readNumber("DEF")
          state.defendPercent += def
          context.log.log(`夢中で絵を描いてると、何をされても気にならなくなっちゃうな DEF+${def}%`)
        }
      }
    }
  },
}

export default skill