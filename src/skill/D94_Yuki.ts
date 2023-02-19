import { SkillLogic } from "../core/skill";
import { LocalDateType } from "../core/user/property";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessStart: (context, state, self) => {
    // 相手不在・足湯は対象外
    if (
      self.which === "offense"
      && !state.pinkMode
      && state.defense
    ) {
      const cnt = state.offense.user.getDailyAccessCount(context, LocalDateType.Today)
      const cntMax = self.skill.property.readNumber("max_access_count")
      return {
        probability: Math.floor(100 * Math.min(cnt, cntMax) / cntMax),
        type: "exp_delivery",
        exp: (d) => d.who === "offense" ? (
          self.skill.property.readNumber("exp") +
            (d.attr === "cool" ? self.skill.property.readNumber("exp_cool") : 0)
        ) : 0
      }
    }
  }
}

export default skill