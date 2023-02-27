import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      const count = state.offense.user.daily.readAccessStationCount(context)
      const maxATK = self.skill.property.readNumber("ATK")
      const maxStation = self.skill.property.readNumber("max_station")
      const atk = Math.floor(maxATK * Math.min(count, maxStation) / maxStation)
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_atk",
        percent: atk,
      }
    }
  }
}

export default skill