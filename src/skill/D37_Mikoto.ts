import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common"
      && self.which === "offense"
      && self.who === "other"
      && getAccessDenco(state, "offense").type === "defender") {
      return {
        probability: self.skill.property.readNumber("probability"),
        recipe: (state) => {
          const def = self.skill.property.readNumber("ATK")
          state.attackPercent += def
          context.log.log(`わたしのスキルはディフェンダーさんのご支援です。立派に勤め上げましょう。DEF+${def}%`)
        }
      }
    }
  }
}

export default skill