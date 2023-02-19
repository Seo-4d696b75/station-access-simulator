import { assert } from "../core/context";
import { DencoAttribute } from "../core/denco";
import { triggerSkillAtEvent } from "../core/event";
import { activateSkillAt, SkillLogic } from "../core/skill";
import { copy } from "../gen/copy";

const skill: SkillLogic = {
  transitionType: "auto",
  deactivate: "default_timeout",
  onLinkStarted: (context, state, self, link) => {
    // unable状態で自身が廃駅以外にリンク開始した
    if (
      link.denco.numbering === self.numbering
      && link.attr !== "unknown"
      && self.skill.transition.state === "unable"
    ) {
      // スキルの発動処理はスキル発動としてイベント記録する
      return triggerSkillAtEvent(
        context,
        state,
        self,
        {
          probability: self.skill.property.readNumber("probability_activate"), // 100%
          type: "skill_event",
          recipe: (state) => {
            // スキル有効化
            activateSkillAt(context, state, self.carIndex)
            // 属性変化
            const d = state.formation[self.carIndex]
            context.log.log(`属性の変更 ${d.attr} => ${link.attr}`)
            d.attr = link.attr as DencoAttribute
          }
        }
      )
    }
  },
  onCooldown: (context, state, self) => {
    // 属性を元に戻す
    // スキル発動時とは異なり特にイベント記録などは残さない
    const next = copy.UserState(state)
    next.formation[self.carIndex].attr = "cool"
    return next
  },
  onAccessDamagePercent: (context, state, self) => {
    if (self.who !== "other") {
      // ATK, DEF増加両方ありえる
      const attr = self.attr
      assert(attr !== "flat")
      const atk = self.skill.property.readNumber(`ATK_${attr}`, 0)
      const def = self.skill.property.readNumber(`DEF_${attr}`, 0)
      if (self.who === "offense" && atk > 0) {
        return {
          probability: self.skill.property.readNumber("probability"), // 100%
          type: "damage_atk",
          percent: atk
        }
      }
      if (self.who === "defense" && def > 0) {
        return {
          probability: self.skill.property.readNumber("probability"), // 100%
          type: "damage_def",
          percent: def
        }
      }
    }
  },
}

export default skill