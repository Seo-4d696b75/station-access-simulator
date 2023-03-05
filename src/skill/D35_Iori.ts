import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      const keyword = self.skill.property.readString("keyword")
      const max = self.skill.property.readNumber("station_max")
      const target = self.link.filter(link => {
        return link.name.includes(keyword) ||
          link.lines.some(line => line.name.includes(keyword))
      })
      const count = Math.min(target.length, max)
      if (count > 0) {
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "damage_def",
          percent: count * self.skill.property.readNumber("DEF")
        }
      }
    }
  }
}

export default skill