import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      return (state) => {
        const def = self.skill.property.readNumber("DEF")
        state.defendPercent += def
        context.log.log(`夢中で絵を描いてると、何をされても気にならなくなっちゃうな DEF+${def}%`)
      }
    }
  },
  deactivate: "default_timeout"
}

export default skill