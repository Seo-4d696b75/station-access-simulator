import { getSide } from "../core/access";
import { activateSkill, deactivateSkillAt, SkillLogic } from "../core/skill";
import { LocalDateType } from "../core/user/property";

const skill: SkillLogic = {
  transitionType: "auto",
  deactivate: "self_deactivate",
  onUnable: (context, state, self) => {
    // 初期化・cooldown終了の直後にactiveへ状態遷移
    return activateSkill(context, state, self.carIndex)
  },
  onAccessStart: (context, state, self) => {
    if (self.which === "offense") {
      // 前日のアクセス数
      const side = getSide(state, self.which)
      const cnt = side.user.getDailyAccessCount(LocalDateType.Yesterday)
      if (cnt > 0) {
        const maxCnt = self.skill.property.readNumber("max_access_count")
        const maxExp = self.skill.property.readNumber("EXP_max")
        const exp = Math.max(
          Math.floor(maxExp * Math.pow(Math.min(cnt, maxCnt) / maxCnt, 2)),
          1,
        )
        return {
          probability: self.skill.property.readNumber("probability"),
          type: "exp_delivery",
          exp: (d) => d.who === "offense" ? exp : 0,
          sideEffect: (state) => {
            deactivateSkillAt(context, state.offense, self.carIndex)
          }
        }
      }
    }
  }
}

export default skill