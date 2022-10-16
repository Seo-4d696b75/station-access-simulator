import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      const keyword = self.skill.property.readString("keyword")
      const max = self.skill.property.readNumber("station_max")
      const target = self.link.filter(link => {
        return link.name.includes(keyword) ||
          link.lines.some(line => line.name.includes(keyword))
      })
      const count = Math.min(target.length, max)
      if (count > 0) {
        return (state) => {
          const def = count * self.skill.property.readNumber("DEF")
          state.defendPercent += def
          context.log.log(`ワタシ、本が好きで、置いてあるところでじっとしちゃうんですよ DEF+${def}%`)
        }
      }
    }
  }
}

export default skill