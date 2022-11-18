import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "offense") {
      return (state) => {
        const atk = self.skill.property.readNumber("ATK")
        state.attackPercent += atk
        context.log.log(`べ、別にあんたの為じゃないんだからね！ ATK+${atk}%`)
      }
    }
  },
  deactivate: "default_timeout"
}

export default skill