import { getDefense } from "../core/access";
import { SkillLogic } from "../core/skill";


const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return step === "damage_common" && self.who === "defense"
  },
  evaluate: (context, state, step, self) => {
    // ディフェンダー数ごとに増加するDEF定数　
    const def = self.skill.propertyReader("DEF")
    // 編成内のディフェンダー数 self.who === "defense"
    const cnt = getDefense(state).formation.filter(d => d.type === "defender").length
    state.defendPercent += cnt * def
    context.log.log(`編成をディフェンダーで固めるととっても効果的なのよ♪ DEF: ${def}% * ${cnt}(ディフェンダー数) = ${def * cnt}%`)
    return state
  }
}

export default skill