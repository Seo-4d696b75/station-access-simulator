import { SkillLogic } from "../core/skill";
import { LocalDateType } from "../core/user/property";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    // 移動距離1km未満は発動しない?
    const dist = state.offense.user.getDailyDistance(LocalDateType.Today)
    if (self.which !== "offense") return
    if (dist < 1) return
    let atk = 0
    const th = self.skill.property.readNumber("dist")
    if (self.who === "offense") {
      const perDist = self.skill.property.readNumber("ATK_self")
      atk += perDist * Math.min(th, Math.floor(dist))
    }
    if (dist >= th) {
      atk += self.skill.property.readNumber("ATK_other")
    }
    if (atk > 0) {
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_atk",
        percent: atk
      }
    }
  }
}

export default skill