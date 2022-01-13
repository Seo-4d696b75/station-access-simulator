import { getFormation } from "../core/access"
import { SkillLogic } from "../core/skill"
import { evaluateSkillAfterAccess, EventSkillEvaluate } from "../core/skillEvent"

const skill: SkillLogic = {
  onAccessComplete: (context, state, self, access) => {
    // アクセス前後で自編成個体のHPが変化して3割以下となった個体が対象
    // アクセス・被アクセス以外の個体もHPが変化するので自編成の全個体を注目
    const formation = getFormation(access, self.which)
    const target = formation.filter(d => d.hpBefore !== d.currentHp && d.currentHp <= d.maxHp * 0.3)
    if (target.length > 0) {
      const percent = self.skillPropertyReader("probability")
      const heal = self.skillPropertyReader("heal")
      const evaluate: EventSkillEvaluate = (state, self) => {
        context.log.log(`検測開始しま～す HP+${heal}`)
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
      return evaluateSkillAfterAccess(context, state, self, access, percent, evaluate)
    }
  },
}

export default skill