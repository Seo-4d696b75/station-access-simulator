import { canSkillInvalidated, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    // 相手不在・足湯では発動しない
    if (step === "before_access" && state.defense && !state.pinkMode) {
      const any = [
        ...state.defense.formation,
        ...state.offense.formation,
      ].some(d => d.attr === "heat" && canSkillInvalidated(d))
      if (!any) return
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          const target = [
            ...state.offense.formation,
            ...state.defense!.formation,
          ].filter(d => d.attr === "heat" && canSkillInvalidated(d))
          const names = target.map(d => d.name).join(",")
          target.forEach(d => d.skillInvalidated = true)
          context.log.log(`わたしのスキルは相手のスキルもお掃除しちゃう……って感じなの。 無効化：${names}`)
        }
      }
    }
  }
}

export default skill