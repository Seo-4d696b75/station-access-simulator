import { triggerSkillAfterAccess } from "../core/event";
import { extendSkillActiveDuration, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    // 自身は対象外
    if (
      self.which === "offense"
      && self.who !== "offense"
    ) {
      return {
        probability: self.skill.property.readNumber("probability"), // 100%
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  },
  onAccessComplete: (context, access, self) => {
    // 自身以外の編成内がリンク開始
    // リンク時間の延長はスキルイベントとして記録する
    if (
      self.which === "offense"
      && self.who !== "offense"
      && access.linkSuccess
    ) {
      // アクセスで無効化された場合は延長なし
      return triggerSkillAfterAccess(
        context,
        access,
        self,
        {
          probability: self.skill.property.readNumber("probability_extend"), // 100%
          type: "skill_event",
          recipe: (state) => extendSkillActiveDuration(
            context,
            state,
            self.carIndex,
            self.skill.property.readNumber("active_extend"),
            self.skill.property.readNumber("active_limit"),
          )
        }
      )
    }
  },
}

export default skill