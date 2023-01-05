import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    // 足湯対象外
    if (
      step === "before_access"
      && state.defense
      && !state.pinkMode
      && self.which === "offense"
      && getAccessDenco(state, "offense").carIndex === 0
      && getAccessDenco(state, "defense").type === "trickster"
    ) {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          const d = getAccessDenco(state, "defense")
          d.skillInvalidated = true
          context.log.log(`私が歴史について語るとみんな真剣に聞いてくれるの スキル無効化：${d.name}`)
        }
      }
    }
  }
}

export default skill