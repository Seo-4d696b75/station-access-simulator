import { getDefense } from "../core/access";
import { AccessDamageFixed, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamageFixed: (context, state, self) => {
    if (self.which === "defense") {
      const triggers: AccessDamageFixed[] = []
      const stationCount = getDefense(state).user.daily.readAccessStationCount(context)
      if (self.who === "defense") {
        const countSelfTh = self.skill.property.readNumber("station_count_self")
        const unit = self.skill.property.readNumber("damage_fixed_self")
        const count = Math.min(stationCount, countSelfTh)
        const damage = unit * count
        triggers.push({
          probability: self.skill.property.readNumber("probability_self"), // 90%
          type: "damage_fixed",
          damage: damage
        })
      }
      const countOtherTh = self.skill.property.readNumber("station_count_other")
      if (stationCount >= countOtherTh) {
        triggers.push({
          probability: self.skill.property.readNumber("probability_other"), // 100%
          type: "damage_fixed",
          damage: self.skill.property.readNumber("damage_fixed_other")
        })
      }
      return triggers
    }
  }
}

export default skill