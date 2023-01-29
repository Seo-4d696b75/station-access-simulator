import { getBaseDamage, SkillLogic } from "..";

const skill: SkillLogic = {
  transitionType: "always",
  /*
  いちほのスキル発動時の固定ダメージ増減の対応
  スキルと固定ダメージ増減の関係：https://github.com/Seo-4d696b75/station-access-simulator/discussions/25
   */
  onAccessDamageSpecial: (context, state, self) => {
    if (self.who === "defense" && self.currentHp > 1) {
      const base = getBaseDamage(context, state)
      const damage = base.variable + base.constant
      if (damage >= self.currentHp) {
        return {
          probability: self.skill.property.readNumber("probability"),
          type: "damage_special",
          damageCalc: {
            variable: 0,
            // 現在のHP - 1 にダメージ量を固定
            // このダメージ量は固定ダメージによって増えることはあっても減ることはない
            // FIXME
            // 固定ダメージ追加・軽減が同時に発動した場合、固定ダメージの合計が一致しない？
            // https://github.com/Seo-4d696b75/station-access-simulator/issues/27
            constant: self.currentHp - 1,
          }
        }
      }
    }
  }
}

export default skill