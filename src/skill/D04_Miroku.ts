import { getAccessDenco, hasSkillTriggered, repeatAccess } from "../core/access/index";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "after_damage" && self.who === "offense" && state.defense) {
      // 相手がまだリブートしていない & 自身のスキルがまだ発動していない
      const defense = getAccessDenco(state, "defense")
      if (!defense.reboot && !hasSkillTriggered(state.offense, self)) {
        return {
          probabilityKey: "probability",
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