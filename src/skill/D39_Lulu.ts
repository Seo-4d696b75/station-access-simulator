import { getBaseDamage } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamageSpecial: (context, state, self) => {
    if (self.who === "defense" && self.hpBefore === self.maxHp) {
      const damage = getBaseDamage(context, state)
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_special",
        damageCalc: {
          ...damage,
          // 通常ダメージ(ATK,DEF考慮含む)を0にする
          // 一方で軽減不可なダメージ量（チコなど）は対象外
          variable: 0
        }
      }
    }
  }
}

export default skill