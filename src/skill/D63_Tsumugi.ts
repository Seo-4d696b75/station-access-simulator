import { getFormation } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    // cooldownのスキルの数
    const cnt = getFormation(state, self.which)
      .filter(d => d.skill.type === "possess" && d.skill.transition.state === "cooldown")
      .length
    if (cnt > 0 && self.which === "offense") {
      const unit = self.skill.property.readNumber("ATK")
      const atk = unit * cnt
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_atk",
        percent: atk
      }
    } else if (cnt > 0 && self.which === "defense") {
      const unit = self.skill.property.readNumber("DEF")
      const def = unit * cnt
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_def",
        percent: def
      }
    }
  }
}

export default skill