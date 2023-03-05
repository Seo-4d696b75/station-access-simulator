import { accessRandomStation, triggerSkillAfterAccess } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessComplete: (context, access, self) => {
    // 「アクセスされて自身のHPが0になった時」
    if (self.who === "defense" && self.hpAfter === 0) {
      return triggerSkillAfterAccess(
        context,
        access,
        self,
        {
          probability: self.skill.property.readNumber("probability"),
          type: "skill_event",
          recipe: (state) => accessRandomStation(context, state)
        }
      )
    }
  }
}

export default skill