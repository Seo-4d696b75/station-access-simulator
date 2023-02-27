import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      const d = getAccessDenco(state, "offense")
      if (d.attr === "cool") {
        return {
          probability: self.skill.property.readNumber("probability_def"), // 100%
          type: "damage_def",
          percent: self.skill.property.readNumber("DEF_cool")
        }
      } else if (d.attr === "heat") {
        return {
          probability: self.skill.property.readNumber("probability_def"), // 100%
          type: "damage_def",
          percent: self.skill.property.readNumber("DEF_heat")
        }
      }
    }
  },
  onAccessAfterDamage: (context, state, self) => {
    // 被アクセス時のスコア・経験値追加
    if (self.who === "defense" && !self.reboot) {
      return [
        {
          probability: self.skill.property.readNumber("probability_exp"), // 100%
          type: "exp_delivery",
          exp: (d) => d.who === "defense"
            ? self.skill.property.readNumber("exp")
            : 0
        },
        {
          probability: self.skill.property.readNumber("probability_score"), // 100%
          type: "score_delivery",
          score: self.skill.property.readNumber("score")
        }
      ]
    }
  }
}

export default skill