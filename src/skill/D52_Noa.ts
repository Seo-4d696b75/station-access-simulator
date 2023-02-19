import { countDencoType } from "../core/denco";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    // 単独編成では発動しない
    if (self.who === "offense" && state.offense.formation.length > 1) {
      // 自身を除くタイプの数
      const cnt = countDencoType(
        state.offense.formation.filter(d => d.numbering !== self.numbering)
      )
      const unit = self.skill.property.readNumber("ATK")
      const atk = unit * cnt
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_atk",
        percent: atk
      }
    }
  }
}

export default skill