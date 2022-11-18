import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "defense") {
      return (state) => {
        const def = self.skill.property.readNumber("DEF")
        state.defendPercent += def
        context.log.log(`わたしのスキルは編成内のでんこ達の受けるダメージを減らすものだー DEF+${def}%`)
      }
    }
  },
  deactivate: "default_timeout"
}

export default skill