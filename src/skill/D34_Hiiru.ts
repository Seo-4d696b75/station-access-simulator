import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onSkillProbabilityBoost: (context, self) => {
    return {
      probability: 100,
      type: "probability_boost",
      percent: self.skill.property.readNumber("boost")
    }
  }
}

export default skill