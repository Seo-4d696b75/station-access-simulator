import moment from "moment-timezone";
import { SkillLogic } from "..";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && state.defense) {
      const hour = moment(context.currentTime).hour()
      if ((hour < 6 || hour >= 18) && self.who === "defense") {
        return (state) => {
          const def = self.skill.property.readNumber("DEF")
          state.defendPercent += def
          context.log.log(`夜更かしはお肌の大敵♪ DEF ${def}%`)
        }
      }
      if ((6 <= hour && hour < 18) && self.who === "offense") {
        return (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`りんごちゃんは基本日中だけ頑張ります♪ ATK +${atk}%`)
        }
      }
    }
  }
}

export default skill