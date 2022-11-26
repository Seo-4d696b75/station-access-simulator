import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    // 自身のアクセスは対象外
    if (step === "damage_fixed" && self.which === "offense" && self.who !== "offense") {
      const d = getAccessDenco(state, "offense")
      if (d.attr === state.station.attr) {
        return {
          probabilityKey: "probability",
          recipe: (state) => {
            const damage = self.skill.property.readNumber("damage_fixed")
            state.damageFixed += damage
            const exp = self.skill.property.readNumber("EXP")
            const d = getAccessDenco(state, "defense")
            d.exp.skill += exp // スキルによる経験値の追加はどのステップでもいい
            context.log.log(`相手へのフォローも忘れちゃダメだよね♪ 固定ダメージ: ${damage}`)
            context.log.log(`  経験値の付与 ${d.name} +${exp}`)
          }
        }
      }
    }
  }
}

export default skill