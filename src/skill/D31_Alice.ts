import { isWeekendOrHoliday } from '../core/date';
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "auto-condition",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      return {
        probability: "probability",
        recipe: (state) => {
          const def = self.skill.property.readNumber("DEF")
          state.defendPercent += def
          context.log.log(`ありすはねぇ、お休みの日じゃないと″ほんりょうはっき″できないんだぁ～ DEF+${def}%`)
        }
      }
    }
  },
  canActivated: (context, state, self) => {
    // 土日または日本の祝日
    return isWeekendOrHoliday(context.currentTime)
  }
}

export default skill