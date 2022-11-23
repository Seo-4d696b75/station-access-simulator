import moment from "moment-timezone";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          const hour = moment(context.currentTime).hour()
          if (hour < 6 || hour >= 18) {
            const def = self.skill.property.readNumber("DEF_night")
            state.defendPercent += def
            context.log.log(`そないキッチリせんくてもええやん♪ DEF${formatPercent(def)}`)
          } else {
            const def = self.skill.property.readNumber("DEF_morning")
            state.defendPercent += def
            context.log.log(`なんちゅうかお日さん出てはるとやる気でるんよね DEF${formatPercent(def)}`)
          }
        }
      }
    }
  }
}

export default skill