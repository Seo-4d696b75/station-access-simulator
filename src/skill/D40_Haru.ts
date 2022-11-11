import { getDefense } from "../core/access/index";
import { isSkillActive, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    // FIXME 足湯では発動しない
    if (step === "before_access" && self.who === "offense" && state.defense) {
      const all = [
        ...state.offense.formation,
        ...getDefense(state).formation
      ]
      const anySupporter = all.some(d => {
        return d.type === "supporter" && isSkillActive(d.skill) && !d.skillInvalidated
      })
      if (anySupporter) {
        return {
          probability: self.skill.property.readNumber("probability"),
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