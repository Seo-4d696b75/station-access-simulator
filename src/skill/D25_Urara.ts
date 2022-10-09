import { SkillLogic } from "../core/skill";
import { evaluateSkillAtEvent, EventSkillTrigger } from "../core/skillEvent";

const skill: SkillLogic = {
  canEnabled: (context, state, self) => {
    // 編成内（自身除く）にスキル状態が cooldownのでんこが１体以上いる
    return state.formation.some(d => {
      const s = d.skill
      return s.type === "possess" && s.state.type === "cooldown"
    })
  },
  onActivated: (context, state, self) => {
    // スキルが有効化した瞬間にスキル発動
    const trigger: EventSkillTrigger = {
      probability: self.skill.property.readNumber("probability"),
      recipe: (state) => {
        const target = state.formation.filter(d => {
          const s = d.skill
          return s.type === "possess" && s.state.type === "cooldown"
        })
        if (target.length === 0) {
          context.log.error(`cooldownスキル状態が見つかりません`)
        }
        const names = target.map(d => d.name).join(",")
        state.formation.forEach(d => {
          const s = d.skill
          if (s.type === "possess" && s.state.type === "cooldown") {
            s.state = {
              // transitionタイプによってスキル状態の処理は異なる
              // 未初期化に戻してrefreshStateで初期化することでcooldown状態を強制終了する
              type: "not_init",
              transition: s.state.transition,
              data: undefined
            }
          }
        })
        context.log.log(`クールタイムかいじょできる。スキル:${names}`)
      }
    }
    return evaluateSkillAtEvent(context, state, self, trigger)
  },
  deactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active") // 0ms
    const wait = self.skill.property.readNumber("wait")
    const now = context.currentTime
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000,
    }
  },
}

export default skill