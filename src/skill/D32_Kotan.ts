import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense" && state.defense) {
      const count = state.offense.user.daily.readAccessStationCount(context)
      return (state) => {
        const maxATK = self.skill.property.readNumber("ATK")
        const maxStation = self.skill.property.readNumber("max_station")
        const atk = Math.floor(maxATK * Math.min(count, maxStation) / maxStation)
        state.attackPercent += atk
        context.log.log(`駅を巡れば巡るほど心が燃え上がって力が湧いてくるぞぉぉ！！ ATK+${atk}%`)
      }
    }
  }
}

export default skill