import { triggerSkillAfterAccess } from "../core/event";
import { extendSkillActiveDuration, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      return {
        probability: self.skill.property.readNumber("probability"), // 100%
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  },
  onAccessComplete: (context, access, self) => {
    // 自身がアクセスした場合にリンク成否に応じてactive時間増減
    // いずれの場合もスキル発動イベントとして記録する
    if (self.who === "offense") {
      // 直前のアクセス中の無効化の影響受ける
      return triggerSkillAfterAccess(
        context,
        access,
        self,
        {
          probability: 100,
          type: "skill_event",
          recipe: (state) => extendSkillActiveDuration(
            context,
            state,
            self.carIndex,
            access.linkSuccess
              ? self.skill.property.readNumber("active_extend")
              : self.skill.property.readNumber("active_shorten"),
            self.skill.property.readNumber("active_limit"),
          )
        }
      )
    }
  }
}

export default skill