import { AccessSkillTrigger, SkillLogic } from "../core/skill";

function isTargetDamage(d: AccessSkillTrigger): boolean {
  switch (d.type) {
    case "damage_atk":
      return d.percent > 0
    case "damage_fixed":
      return d.damage > 0
    default:
      return false
  }
}

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessBeforeStart: (context, state, self) => {
    if (self.who === "defense") {
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "invalidate_damage",
        isTarget: (d, damage) => d.who === "offense"
          && isTargetDamage(damage)
          // TODO ダメージ量増加だけで判定は可能か？
          && self.skill.property.readStringArray("target").includes(d.numbering),
      }
    }
  },
}

export default skill