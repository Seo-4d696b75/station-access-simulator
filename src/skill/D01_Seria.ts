import { AccessState, ActiveSkillDenco, AfterAccessContext, getFormation } from "../core/access"
import { EventSkillEvaluate, SkillLogic } from "../core/skill"
import { evaluateSkillAfterAccess, SkillEvaluationStep, SkillEventState, ActiveSkillDenco as EventActiveSkill, SkillTriggerResult } from "../core/skillEvent"

const skill: SkillLogic = {
  onAccessComplete: (state: AccessState, self: ActiveSkillDenco): void | SkillTriggerResult => {
    // アクセス前後で自編成個体のHPが変化して3割以下となった個体が対象
    // アクセス・被アクセス以外の個体もHPが変化するので自編成の全個体を注目
    const formation = getFormation(state, self.which)
    const target = formation.filter(d => d.hpBefore !== d.currentHp && d.currentHp <= d.maxHp * 0.3)
    if (target.length > 0) {
      const percent = self.propertyReader("probability")
      const heal = self.propertyReader("heal")
      const evlauate: EventSkillEvaluate = (state, step, self) => {
        return {
          ...state,
          formation: state.formation.map(d => {
            // 編成は変わらない前提
            const before = formation[d.carIndex].hpBefore
            if (before !== d.currentHp && d.currentHp <= d.maxHp * 0.3) {
              return {
                ...d,
                currentHp: Math.min(d.maxHp, d.currentHp + heal)
              }
            } else {
              return d
            }
          })
        }
      }
      return evaluateSkillAfterAccess(state, self, evlauate, percent)
    }
  },
}

export default skill