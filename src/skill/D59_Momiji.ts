import { getDefense } from "../core/access";
import { countDencoType } from "../core/denco";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      const cnt = countDencoType(getDefense(state).formation)
      const unit = self.skill.property.readNumber("ATK")
      const atk = unit * cnt
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_atk",
        percent: atk
      }
    }
  }
}

export default skill