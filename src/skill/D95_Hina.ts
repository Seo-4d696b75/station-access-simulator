import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    // 自身・相手編成の全員が対象
    return {
      probability: self.skill.property.readNumber("probability"),
      type: "damage_atk",
      percent: self.skill.property.readNumber("ATK")
    }
  }
}

export default skill