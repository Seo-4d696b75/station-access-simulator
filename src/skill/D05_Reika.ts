import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "offense") {
      return {
        probability: "probability",
        recipe: (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`べ、別にあんたの為じゃないんだからね！ ATK+${atk}%`)
        }
      }
    }
  },
}

export default skill