import { getDefense } from "../core/access/index";
import { SkillLogic } from "../core/skill";


const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      // ディフェンダー数ごとに増加するDEF定数　
      const def = self.skill.property.readNumber("DEF")
      // 編成内のディフェンダー数 self.who === "defense"
      const cnt = getDefense(state).formation.filter(d => d.type === "defender").length
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_def",
        percent: def * cnt,
      }
    }
  }
}

export default skill