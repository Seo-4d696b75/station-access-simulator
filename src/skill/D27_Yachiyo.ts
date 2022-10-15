import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      const predicate = getDefense(state).user.history?.isHomeStation
      if (!predicate || predicate(state.station)) {
        return (state) => {
          if (!predicate) context.log.log("「地元」駅の判定が未定義のためデフォルトで発動します")
          const def = self.skill.property.readNumber("DEF")
          context.log.log(`わたしのスキル、よくアクセスする駅やその近くで活躍するんだって。DEF+${def}%`)
          state.defendPercent += def
        }
      }
    }
  }
}

export default skill