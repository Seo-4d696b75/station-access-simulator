import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      const isHome = getDefense(state).user.history.isHomeStation(context, state.station)
      if (isHome) {
        return {
          probabilityKey: "probability",
          recipe: (state) => {
            const def = self.skill.property.readNumber("DEF")
            context.log.log(`わたしのスキル、よくアクセスする駅やその近くで活躍するんだって。DEF+${def}%`)
            state.defendPercent += def
          }
        }
      }
    }
  }
}

export default skill