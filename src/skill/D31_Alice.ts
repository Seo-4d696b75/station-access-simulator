import { isHoliday } from '@holiday-jp/holiday_jp';
import moment from 'moment-timezone';
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      return {
        probability: self.skill.property.readNumber("probability"),
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
    const weekday = moment(context.currentTime).day()
    if (weekday === 0 || weekday === 6) return true
    return isHoliday(new Date(context.currentTime))
  }
}

export default skill