import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      // 現在のHPが相手より高い
      const d = getAccessDenco(state, "offense")
      if (self.currentHp > d.currentHp) {
        return {
          probabilityKey: "probability",
          recipe: (state) => {
            const diff = self.currentHp - d.currentHp
            // 0 < diff < 自身の最大HP
            // 正規化して適当にガンマ補正
            // FIXME 正確な計算式は不明
            const maxDEF = self.skill.property.readNumber("def_max")
            const def = Math.floor(maxDEF * Math.pow(diff / self.maxHp, 0.5))
            context.log.log(`わたし、駅を守るのがんばる。 DEF+${def}%`)
            state.defendPercent += def
          }
        }
      }
    }
  },
}

export default skill