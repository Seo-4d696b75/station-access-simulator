import { getDefense } from "../core/access/access";
import { SkillLogic } from "../core/skill";


const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      return (state) => {
        // ディフェンダー数ごとに増加するDEF定数　
        const def = self.skill.property.readNumber("DEF")
        // 編成内のディフェンダー数 self.who === "defense"
        const cnt = getDefense(state).formation.filter(d => d.type === "defender").length
        state.defendPercent += cnt * def
        context.log.log(`編成をディフェンダーで固めるととっても効果的なのよ♪ DEF: ${def}% * ${cnt}(ディフェンダー数) = ${def * cnt}%`)
      }
    }
  }
}

export default skill