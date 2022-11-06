import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      const isHome = getDefense(state).user.history.isHomeStation(context, state.station)
      if (isHome) {
        return (state) => {
          const def = self.skill.property.readNumber("DEF")
          context.log.log(`わたしのスキル、よくアクセスする駅やその近くで活躍するんだって。DEF+${def}%`)
          state.defendPercent += def
        }
      }
    }
  }
}

export default skill