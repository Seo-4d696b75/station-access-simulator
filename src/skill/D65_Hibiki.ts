import { getDefense } from "../core/access";
import { triggerSkillAfterAccess } from "../core/event";
import { isSkillActive, SkillLogic } from "../core/skill";

// バッテリーの使用はシミュレーション対象外
const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "before_access" && self.who === "defense" && !state.pinkMode) {
      // 被アクセスで編成内のサポーター無効化
      const indices = getDefense(state)
        .formation
        .filter(d => d.type === "supporter" && isSkillActive(d.skill) && !d.skillInvalidated)
        .map(d => d.carIndex)
      if (indices.length > 0) {
        return {
          probability: "probability_support",
          recipe: (state) => {
            const formation = getDefense(state).formation
            const target = indices.map(i => formation[i])
            target.forEach(d => d.skillInvalidated = true)
            const names = target.map(d => d.name).join(",")
            context.log.log(`私のスキルはちょっと難しい効果なの サポーターの無効化: ${names}`)
          }
        }
      }
    }
  },
  onAccessComplete: (context, state, self, access) => {
    // アクセス前後で自身のHPが変化して99%以下となった個体が対象
    const percentTh = self.skill.property.readNumber("heal_th")
    // リブート時はhpAfter = 0なので最終的なHP(currentHp)を参照する
    if (self.hpBefore > self.currentHp && self.currentHp <= self.maxHp * percentTh / 100) {
      return triggerSkillAfterAccess(context, state, self, {
        probability: "probability_heal",
        recipe: (state) => {
          const d = state.formation[self.carIndex]
          const percentHeal = self.skill.property.readNumber("heal")
          const heal = Math.floor(d.maxHp * percentHeal / 100)
          const after = Math.min(d.currentHp + heal, d.maxHp)
          context.log.log(`体力にはとっても自信があるの♪ HP+${heal} ${d.currentHp} => ${after}/${d.maxHp}`)
          d.currentHp = after
        }
      })
    }
  }
}

export default skill