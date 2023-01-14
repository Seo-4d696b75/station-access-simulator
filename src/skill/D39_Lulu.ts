import { getBaseDamage } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_special" && self.who === "defense" && self.hpBefore === self.maxHp) {
      return {
        probability: "probability",
        recipe: (state) => {
          const damage = getBaseDamage(context, state)
          // 通常ダメージ(ATK,DEF考慮含む)を0にする
          // 一方で軽減不可なダメージ量（チコなど）は対象外
          damage.variable = 0
          state.damageBase = damage
          context.log.log(`るる集中してると、話しかけられてもきづかへんときあるんよ…… damage:${JSON.stringify(damage)}`)
        }
      }
    }
  }
}

export default skill