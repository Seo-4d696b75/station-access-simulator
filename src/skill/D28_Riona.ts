import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense" && state.defense) {
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
}

export const calcATK = (max: number, diff: number): number => {
  // 計算式は適当 10駅差で Max * (1 - 1/e) だいたい Max * 2/3
  return Math.round(max * (1 - Math.exp(-diff / 10)))
}

export default skill