import { Context } from "vm"
import { getFormation } from "../core/access"
import { getCurrentTime } from "../core/context"
import { SkillLogic } from "../core/skill"
import { evaluateSkillAfterAccess, SkillEventEvaluate } from "../core/skillEvent"

const skill: SkillLogic = {
  onAccessComplete: (context, state, self, access) => {
    // アクセス前後で自編成個体のHPが変化して3割以下となった個体が対象
    // アクセス・被アクセス以外の個体もHPが変化するので自編成の全個体を注目
    const formation = getFormation(access, self.which)
    const target = formation.filter(d => d.hpBefore !== d.currentHp && d.currentHp <= d.maxHp * 0.3)
    if (target.length > 0) {
      const percent = self.skill.property.readNumber("probability")
      const heal = self.skill.property.readNumber("heal")
      // lambdaからAccessStateを参照
      const evaluate: SkillEventEvaluate = (context, state, self) => {
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
      return evaluateSkillAfterAccess(context, state, self, percent, evaluate)
    }
  },
  disactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const time = getCurrentTime(context)
    return {
      activeTimeout: time + active * 1000,
      cooldownTimeout: time + (active + wait) * 1000,
    }
  }
}

export default skill