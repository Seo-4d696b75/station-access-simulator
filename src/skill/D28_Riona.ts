import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      // アクセス数の差
      const diff = (getDefense(state).user.getAccessCount(context, state.station))
        - (state.offense.user.getAccessCount(context, state.station))
      if (diff > 0) {
        const max = self.skill.property.readNumber("ATK")
        const atk = calcATK(max, diff)
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "damage_atk",
          percent: atk
        }
      }
    }
  }
}

export const calcATK = (max: number, diff: number): number => {
  // 計算式は適当 10駅差で Max * (1 - 1/e) だいたい Max * 2/3
  return Math.round(max * (1 - Math.exp(-diff / 10)))
}

export default skill