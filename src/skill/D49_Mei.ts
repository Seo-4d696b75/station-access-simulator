import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      // 現在のHPが相手より高い
      const d = getAccessDenco(state, "offense")
      if (self.currentHp > d.currentHp) {
        const diff = self.currentHp - d.currentHp
        // 0 < diff < 自身の最大HP
        // 正規化して適当にガンマ補正
        // TODO 正確な計算式は不明
        const maxDEF = self.skill.property.readNumber("def_max")
        const def = Math.floor(maxDEF * Math.pow(diff / self.maxHp, 0.5))
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "damage_def",
          percent: def
        }
      }
    }
  },
}

export default skill