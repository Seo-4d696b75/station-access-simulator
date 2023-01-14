import { accessRandomStation, triggerSkillAfterAccess } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessComplete: (context, state, self, access) => {
    // 「アクセスされて自身のHPが0になった時」
    if (self.who === "defense" && self.hpAfter === 0) {
      return triggerSkillAfterAccess(context, state, self, {
        probability: "probability",
        recipe: (state) => accessRandomStation(context, state)
      })
    }
  }
}

export default skill