import { triggerSkillAfterAccess } from "../core/event";
import { SkillLogic } from "../core/skill";

// バッテリーの使用はシミュレーション対象外
const skill: SkillLogic = {
  transitionType: "always",
  onAccessBeforeStart: (context, state, self) => {
    // 被アクセスで編成内のサポーター無効化
    if (self.who === "defense" && !state.pinkMode) {
      return {
        probability: self.skill.property.readNumber("probability_supporter"),
        type: "invalidate_skill",
        isTarget: (d) => d.which === "defense" && d.type === "supporter",
      }
    }
  },
  onAccessComplete: (context, access, self) => {
    // アクセス前後で自身のHPが変化して99%以下となった個体が対象
    const percentTh = self.skill.property.readNumber("heal_th")
    // リブート時はhpAfter = 0なので最終的なHP(currentHp)を参照する
    if (self.hpBefore > self.currentHp && self.currentHp <= self.maxHp * percentTh / 100) {
      return triggerSkillAfterAccess(
        context,
        access,
        self,
        {
          probability: self.skill.property.readNumber("probability_heal"),
          type: "skill_event",
          recipe: (state) => {
            const d = state.formation[self.carIndex]
            const percentHeal = self.skill.property.readNumber("heal")
            const heal = Math.floor(d.maxHp * percentHeal / 100)
            const after = Math.min(d.currentHp + heal, d.maxHp)
            d.currentHp = after
          }
        }
      )
    }
  }
}

export default skill