import { getDefense } from "../core/access/index";
import { isSkillActive, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessBeforeStart: (context, state, self) => {
    if (
      self.who === "offense"
      && state.defense
      && !state.pinkMode
    ) {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "invalidate_skill",
        isTarget: (d) => d.type === "supporter"
      }
    }
  },
  triggerOnAccess: (context, state, step, self) => {
    if (step === "before_access" && self.who === "offense" && state.defense && !state.pinkMode) {
      const all = [
        ...state.offense.formation,
        ...getDefense(state).formation
      ]
      const anySupporter = all.some(d => {
        return d.type === "supporter" && isSkillActive(d.skill) && !d.skillInvalidated
      })
      if (anySupporter) {
        return {
          probability: "probability",
          recipe: (state) => {
            const all = [
              ...state.offense.formation,
              ...getDefense(state).formation
            ]
            const target = all.filter(d => d.type === "supporter" && isSkillActive(d.skill))
            const names = target.map(d => d.name).join(",")
            target.forEach(d => d.skillInvalidated = true)
            context.log.log(`ハルはひとりで大丈夫だもん！！ 無効化：${names}`)
          }
        }
      }
    }
  }
}

export default skill