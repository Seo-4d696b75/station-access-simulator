import { assert } from "../core/context";
import { formatDuration } from "../core/date";
import { triggerSkillAtEvent } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual-condition",
  deactivate: "default_timeout",
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
    return triggerSkillAtEvent(
      context,
      state,
      self,
      {
        probability: self.skill.property.readNumber("probability", 100),
        type: "skill_event",
        recipe: (state) => {
          const percent = self.skill.property.readNumber("extend")
          /*
          Note スキルのcooldown時間には影響しない！
          cooldown終了時刻はスキル発動のタイミングで決定される
          このスキルが干渉するのはactive終了時刻のみ
          */
          context.log.log("スキルactive時間の延長")
          state.formation.forEach(d => {
            if (d.name === self.name) return
            if (d.type !== "supporter") return
            const s = d.skill
            if (s.type !== "possess") return
            if (s.transition.state !== "active") return
            // active, cooldownの時間があるスキルタイプのみ
            if (s.transition.data?.cooldownTimeout) {
              assert(s.transition.data.activeTimeout > s.transition.data.activatedAt)
              const duration = s.transition.data.activeDuration
              const v = duration * (1 + percent / 100)
              // 端数を切り捨てて分単位に調整
              const unit = 60 * 1000 // ms
              const nextDuration = unit * Math.floor(v / unit)
              const nextTimeout = s.transition.data.activatedAt + nextDuration
              s.transition = {
                state: "active",
                data: {
                  activatedAt: s.transition.data.activatedAt,
                  activeTimeout: nextTimeout,
                  activeDuration: s.transition.data.activeDuration,
                  cooldownTimeout: s.transition.data.cooldownTimeout, // cooldownの終了時刻は固定
                  cooldownDuration: s.transition.data.cooldownDuration,
                }
              }
              context.log.log(`${d.firstName} ${formatDuration(duration)} => ${formatDuration(nextDuration)}`)
            }
          })
        }
      }
    )
  },
}

export default skill