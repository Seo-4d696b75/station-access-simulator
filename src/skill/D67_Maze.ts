import { AccessSkillTriggers, getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_fixed" && self.which === "defense") {
      const triggers: AccessSkillTriggers = []
      const stationCount = getDefense(state).user.daily.readAccessStationCount(context)
      if (self.who === "defense") {
        triggers.push({
          probabilityKey: "probability_self",
          recipe: (state) => {
            const countSelfTh = self.skill.property.readNumber("station_count_self")
            const unit = self.skill.property.readNumber("damage_fixed_self")
            const count = Math.min(stationCount, countSelfTh)
            const damage = unit * count
            state.damageFixed += damage
            context.log.log(`体力は結構自身あるぞ！ 固定ダメージ(自身) -${damage}(${unit} x ${count}駅)`)
          }
        })
      }
      const countOtherTh = self.skill.property.readNumber("station_count_other")
      if (stationCount >= countOtherTh) {
        triggers.push({
          probabilityKey: "probability_other",
          recipe: (state) => {
            const damage = self.skill.property.readNumber("damage_fixed_other")
            state.damageFixed += damage
            context.log.log(`あたし、なが～く思い出集めしてても疲れないんだ！ 固定ダメージ(編成内) -${damage}(${stationCount}駅)`)
          }
        })
      }
      return triggers
    }
  }
}

export default skill