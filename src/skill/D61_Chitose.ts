import { canSkillInvalidated, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    // 相手不在・足湯では発動しない
    if (step === "before_access" && state.defense && !state.pinkMode) {
      const anySupporter = [
        ...state.offense.formation,
        ...state.defense.formation,
      ].some(d => d.type === "supporter" && canSkillInvalidated(d))
      if (!anySupporter) return // 無効化の対象が存在しない
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          const target = [
            ...state.offense.formation,
            ...state.defense!.formation,
          ].filter(d => d.type === "supporter" && canSkillInvalidated(d))
          const names = target.map(d => d.name).join(",")
          target.forEach(d => d.skillInvalidated = true)
          context.log.log(`サポーターのスキルも何のその、ですよ♪ 無効化：${names}`)
        },
      }
    }
  },
}

export default skill