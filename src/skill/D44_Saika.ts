import { SkillLogic } from "../core/skill";
import { LocalDateType } from "../core/user/property";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    // 移動距離3km未満は発動しない?
    const dist = state.offense.user.getDailyDistance(context, LocalDateType.Today)
    if (self.who === "offense" && dist >= 3.0) {
      const threshold1 = self.skill.property.readNumber("threshold1")
      const threshold2 = self.skill.property.readNumber("threshold2")
      const atk1 = self.skill.property.readNumber("ATK1")
      const atk2 = self.skill.property.readNumber("ATK2")
      // TODO どこで端数を切り捨てるか？
      const atk = atk1 * Math.floor(Math.min(threshold1, dist))
        + atk2 * Math.floor(Math.max(Math.min(threshold2, dist) - threshold1, 0))
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_atk",
        percent: atk,
      }
    }
  }
}

export default skill