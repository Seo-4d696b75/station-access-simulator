import { calcBaseDamage, getAccessDenco } from "../core/access";
import { getCurrentTime } from "../core/context";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (self.who === "offense" && state.defense !== undefined) {
      const defense = getAccessDenco(state, "defense")
      if (step === "damage_special" && defense.numbering === "25") {
        return (state) => {
          const heal = self.skill.property.readNumber("heal")
          const base = calcBaseDamage(context, state)
          // 通常のATK&DEF増減による計算を考慮する
          const value = Math.floor(base * heal / 100)
          // 回復量は負数のダメージ量として処理
          state.damageBase = {
            variable: 0, // variable は0以上に計算が入る
            constant: -value + (state.damageBase?.constant ?? 0)
          }
          context.log.log(`うららちゃんは可愛くて思わずいい子いい子しちゃうわぁ～♪ 回復:${value} = base:${base} * ${heal}%`)
        }
      } else if (step === "damage_common" && defense.numbering !== "25") {
        return (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`今日も愛するうららちゃんをひとりじめするため、野暮な連中をふっ飛ばすわよ! ATK+${atk}%`)
        }
      }
    }
  },
  disactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = getCurrentTime(context)
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000,
    }
  },
}

export default skill