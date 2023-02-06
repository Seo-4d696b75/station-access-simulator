import { triggerSkillAtEvent } from "../core/event";
import { activateSkillAt, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "auto",
  deactivate: "default_timeout",
  onLinkStarted: (context, state, self, link) => {
    if (self.skill.transition.state !== "unable") return
    // 自身を除いてリンク数をカウント
    const linkCount = state.formation
      .filter(d => d.name !== self.name)
      .map(d => d.link.length)
      .reduce((a, b) => a + b)
    const linkCountTh = self.skill.property.readNumber("link_count")
    if (linkCount >= linkCountTh) {
      // 条件を満たしたら自動で有効化
      // 有効化はスキル発動として処理する（イベント記録される）
      return triggerSkillAtEvent(
        context,
        state,
        self,
        {
          probability: self.skill.property.readNumber("probability_activate"), // 100%
          type: "skill_event",
          recipe: (state) => activateSkillAt(context, state, self.carIndex)
        }
      )
    }
  },
  onAccessDamageFixed: (context, state, self) => {
    if (self.who === "offense") {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_fixed",
        damage: self.skill.property.readNumber("damage_fixed"),
      }
    }
  }
}

export default skill