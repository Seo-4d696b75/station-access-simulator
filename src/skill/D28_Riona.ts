import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense") {
      // アクセス数の差
      const diff = (getDefense(state).user.history.getStationAccessCount(context, state.station))
        - (state.offense.user.history.getStationAccessCount(context, state.station))
      if (diff > 0) {
        return (state) => {
          // 最大ATK上昇量
          const max = self.skill.property.readNumber("ATK")
          const atk = calcATK(max, diff)
          context.log.log(`わたしのスキルは相手がデータを蓄積しているほど有利に働きます。ATK+${atk}%`)
          state.attackPercent += atk
        }
      }
    }
  },
  deactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = context.currentTime
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000
    }
  },
}

export const calcATK = (max: number, diff: number): number => {
  // 計算式は適当 10駅差で Max * (1 - 1/e) だいたい Max * 2/3
  return Math.round(max * (1 - Math.exp(-diff / 10)))
}

export default skill