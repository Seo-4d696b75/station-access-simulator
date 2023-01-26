import { getSide } from "../core/access"
import { triggerSkillAfterAccess } from "../core/event"
import { formatPercent } from "../core/format"
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessComplete: (context, access, self) => {
    if (!self.skill.active) return
    // アクセス前後で自編成個体のHPが変化して3割以下となった個体が対象
    // アクセス・被アクセス以外の個体もHPが変化するので自編成の全個体を注目
    const percentTh = self.skill.property.readNumber("heal_th")
    // アクセス側もカウンターなどダメージ受ける場合あり
    const formation = getSide(access, self.which).formation
    // リブート時はhpAfter = 0なので最終的なHP(currentHp)を参照する
    const indices = formation
      .filter(d => d.hpBefore > d.currentHp && d.currentHp <= d.maxHp * percentTh / 100)
      .map(d => d.carIndex)
    if (indices.length > 0) {
      return triggerSkillAfterAccess(
        context,
        access,
        self,
        {
          probability: self.skill.property.readNumber("probability"),
          type: "skill_event",
          recipe: (state) => {
            const percentHeal = self.skill.property.readNumber("heal")
            context.log.log(`検測開始しま～す HP${formatPercent(percentHeal)}`)
            indices.forEach(idx => {
              // 編成は変わらない前提
              const d = state.formation[idx]
              const heal = Math.floor(d.maxHp * percentHeal / 100)
              const after = Math.min(d.currentHp + heal, d.maxHp)
              context.log.log(`  ${d.name} HP+${heal} ${d.currentHp} => ${after}/${d.maxHp}`)
              d.currentHp = after
            })
          }
        },
      )
    }
  },
}

export default skill