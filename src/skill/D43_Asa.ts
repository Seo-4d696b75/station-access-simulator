import { formatDuration } from "../core/date";
import { SkillEventState, triggerSkillAtEvent } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  canEnabled: (context, state, self) => {
    return state.formation.some(d => {
      //　編成内（自身を除く）にスキル状態がactiveなサポータがひとり以上いる
      if (d.name === self.name) return false
      if (d.type !== "supporter") return false
      const s = d.skill
      if (s.type !== "possess") return false
      if (s.transition.state !== "active") return false
      /*
       active, cooldownの時間があるスキルタイプのみ
       スキル状態の遷移タイプ：manual, manual-condition, auto
       ただし、上記タイプでもactive, cooldown終了が時刻で指定されない場合がある
       （例）manual アクセスしてリンクに失敗したらcooldown
       */
      return !!s.transition.data?.cooldownTimeout
    })
  },
  onActivated: (context, state, self) => {
    // スキルが有効化した瞬間にスキル発動
    const trigger = (state: SkillEventState) => {
      const percent = self.skill.property.readNumber("extend")
      context.log.log(`サポーターってなかなか大変だよね。スキルもう少し頑張りたいってときに、わたしが応援する スキル時間+${percent}%`)
      /*
      Note スキルのcooldown時間には影響しない！
      cooldown終了時刻はスキル発動のタイミングで決定される
      このスキルが干渉するのはactive終了時刻のみ
      */
      state.formation.forEach(d => {
        if (d.name === self.name) return
        if (d.type !== "supporter") return
        const s = d.skill
        if (s.type !== "possess") return
        if (s.transition.state !== "active") return
        // active, cooldownの時間があるスキルタイプのみ
        if (s.transition.data?.cooldownTimeout) {
          const duration = s.transition.data.activeTimeout - s.transition.data.activatedAt
          if (duration < 0) context.log.error("スキルのactive時間が負数です")
          const v = duration * (1 + percent / 100)
          // 端数を切り捨てて分単位に調整
          const unit = 60 * 1000 // ms
          const nextDuration = unit * Math.floor(v / unit)
          const nextTimeout = s.transition.data.activatedAt + nextDuration
          s.transition = {
            state: "active",
            type: s.transition.type,
            data: {
              activatedAt: s.transition.data.activatedAt,
              activeTimeout: nextTimeout,
              cooldownTimeout: s.transition.data.cooldownTimeout,
            }
          }
          context.log.log(`${d.name} ${formatDuration(duration)} => ${formatDuration(nextDuration)}`)
        }
      })
    }
    return triggerSkillAtEvent(context, state, self, trigger)
  },
  deactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = context.currentTime
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000
    }
  }
}

export default skill