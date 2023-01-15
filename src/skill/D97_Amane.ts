import { assert } from "../core/context";
import { triggerSkillAfterAccess } from "../core/event";
import { formatPercent } from "../core/format";
import { getSkill, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense") {
      return {
        probability: "probability", // 100%
        recipe: (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`天地を駆け抜ける風のように参上！ATK${formatPercent(atk)}`)
        }
      }
    }
  },
  onAccessComplete: (context, state, self, access) => {
    // 自身がアクセスした場合にリンク成否に応じてactive時間増減
    // いずれの場合もスキル発動イベントとして記録する
    if (self.who === "offense") {
      // 直前のアクセス中の無効化の影響受ける
      return triggerSkillAfterAccess(
        context,
        state,
        self,
        {
          probability: 100,
          recipe: (state) => {
            const d = state.formation[self.carIndex]
            const skill = getSkill(d)
            assert(skill.transition.state === "active")
            assert(skill.transition.data)
            const data = skill.transition.data
            const activeExtend = access.linkSuccess
              ? self.skill.property.readNumber("active_extend")
              : self.skill.property.readNumber("active_shorten")
            const activeLimit = self.skill.property.readNumber("active_limit")
            assert(data.activeTimeout > context.currentTime)
            // 現在時刻から起算して最大1時間でactive時間延長
            const extend = Math.min(
              activeExtend * 1000,
              context.currentTime + activeLimit * 1000 - data.activeTimeout,
            )
            data.activeTimeout += extend
            // クールダウン時間はそのまま
            data.cooldownTimeout += extend
          }
        }
      )
    }
  }
}

export default skill