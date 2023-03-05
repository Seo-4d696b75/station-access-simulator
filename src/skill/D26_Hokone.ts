import { calcAccessDamage, getAccessDenco } from "../core/access/index";
import { assert } from "../core/context";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    const d = getAccessDenco(state, "defense")
    if (self.who === "offense" && d.numbering !== "25") {
      return {
        probability: self.skill.property.readNumber("probability_atk", 100),
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  },
  onAccessDamageSpecial: (context, state, self) => {
    const d = getAccessDenco(state, "defense")
    if (self.who === "offense" && d.numbering === "25") {
      assert(state.damageBase?.constant ?? 0 === 0, "想定外のダメージ計算が既に実行されています！")
      const heal = self.skill.property.readNumber("heal")
      const base = calcAccessDamage(context, state)
      // 通常のATK&DEF増減による計算を考慮する
      const value = Math.floor(base * heal / 100)
      return {
        probability: self.skill.property.readNumber("probability_heal", 100),
        type: "damage_special",
        damageCalc: {
          // 後続の固定ダメージ増減において、
          // 固定ダメージ追加：ダメージが追加される（回復量が減る）
          // 固定ダメージ軽減：変化しない
          variable: 0,
          // 回復量は負数のダメージ量として処理
          constant: -value,
        }
      }
    }

  }
}

export default skill