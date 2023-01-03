import { triggerSkillAtEvent } from "../core/event";
import { activateSkill, deactivateSkillAt, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "auto",
  deactivate: "self_deactivate", // active => cooldownのタイミングはスキル側で制御
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_fixed" && self.who === "offense") {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          const damage = self.skill.property.readNumber("damage_fixed")
          state.damageFixed += damage
          context.log.log(`年の功というやつで、腕には自信がある 固定ダメージ+${damage}`)
        }
      }
    }
  },
  onUnable: (context, state, self) => {
    // 初期化・cooldown終了の直後にactiveへ状態遷移
    return activateSkill(context, state, self.carIndex)
  },
  onLinkStarted: (context, state, self, link) => {
    // 自身がリンク成功＆スキルactive
    if (link.denco.numbering !== self.numbering) return
    if (!self.skill.active) return
    return triggerSkillAtEvent(
      context,
      state,
      self,
      {
        probabilityKey: "probability_skill",
        recipe: (_) => {
          // 確率の判定が成功したらそのままactive
          context.log.log(`ねものスキル状態がactiveで継続します`)
        },
        fallbackRecipe: (state) => {
          // active終了
          context.log.log(`ねものスキルのactive状態継続に失敗しました`)
          deactivateSkillAt(context, state, self.carIndex)
        }
      }
    )
  }
}

export default skill