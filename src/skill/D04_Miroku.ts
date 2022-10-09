import { getAccessDenco, hasSkillTriggered, repeatAccess } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "after_damage" && self.who === "offense" && state.defense) {
      // 相手がまだリブートしていない & まだ発動していない
      const defense = getAccessDenco(state, "defense")
      if (!defense.reboot && !hasSkillTriggered(state.offense, self)) {
        return {
          probability: self.skill.property.readNumber("probability"),
          recipe: (state) => {
            context.log.log("気合入れて頑張っていこー♪")
            return repeatAccess(context, state)
          }
        }
      }
    }
  }
}

export default skill