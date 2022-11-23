import { triggerSkillAfterAccess } from "../core/event"
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessComplete: (context, state, self) => {
    // アクセス前後で自編成個体のHPが変化して3割以下となった個体が対象
    // アクセス・被アクセス以外の個体もHPが変化するので自編成の全個体を注目
    const formation = state.formation
    const target = formation.filter(d => d.hpBefore !== d.currentHp && d.currentHp <= d.maxHp * 0.3)
    if (target.length > 0) {
      return triggerSkillAfterAccess(context, state, self, {
        probabilityKey: "probability",
        recipe: (state) => {
          const heal = self.skill.property.readNumber("heal")
          context.log.log(`検測開始しま～す HP+${heal}`)
          state.formation.forEach(d => {
            // 編成は変わらない前提
            const before = formation[d.carIndex].hpBefore
            if (before !== d.currentHp && d.currentHp <= d.maxHp * 0.3) {
              d.currentHp = Math.min(d.maxHp, d.currentHp + heal)
            }
          })
        }
      })
    }
  },
}

export default skill