import { assert } from "../core/context";
import { triggerSkillAfterAccess } from "../core/event";
import { formatPercent } from "../core/format";
import { getSkill, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    // 自身は対象外
    if (
      step === "damage_common"
      && self.which === "offense"
      && self.who !== "offense"
    ) {
      return {
        probabilityKey: "probability", // 100%
        recipe: (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`楽しい時間って終わってほしくないやん？ ATK${formatPercent(atk)}`)
        }
      }
    }
  },
  onAccessComplete: (context, state, self, access) => {
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
        state,
        self,
        {
          probabilityKey: "probability_extend", // 100%
          recipe: (state) => {
            const d = state.formation[self.carIndex]
            const skill = getSkill(d)
            assert(skill.transition.state === "active")
            assert(skill.transition.data, "スキル時間のデータが見つかりません")
            const data = skill.transition.data
            const activeExtend = self.skill.property.readNumber("active_extend")
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
  },
}

export default skill