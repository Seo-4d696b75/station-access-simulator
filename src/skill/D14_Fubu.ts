import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "defense") {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          const def = self.skill.property.readNumber("DEF")
          state.defendPercent += def
          context.log.log(`わたしのスキルは編成内のでんこ達の受けるダメージを減らすものだー DEF+${def}%`)
        }
      }
    }
  },
}

export default skill