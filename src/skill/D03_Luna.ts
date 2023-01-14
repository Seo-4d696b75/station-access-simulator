import dayjs from "dayjs"
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" &&
      self.who === "defense") {
      return {
        probability: "probability",
        recipe: (state) => {
          const hour = dayjs.tz(context.currentTime).hour()
          if (hour < 6 || hour >= 18) {
            const def = self.skill.property.readNumber("DEF_night")
            state.defendPercent += def
            context.log.log(`夜はこれからなんよ～ DEF+${def}%`)
          } else {
            const def = self.skill.property.readNumber("DEF_morning")
            state.defendPercent += def
            context.log.log(`まだ眠いんよ～ DEF${def}%`)
          }
        }
      }
    }
  }
}

export default skill