import { assert } from "../core/context";
import { triggerSkillAtEvent } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual-condition",
  deactivate: "default_timeout",
  canEnabled: (context, state, self) => {
    // 編成内（自身除く）にスキル状態が cooldownのでんこが１体以上いる
    return state.formation.some(d => {
      if (d.name === self.name) return false
      const s = d.skill
      return s.type === "possess" && s.transition.state === "cooldown"
    })
  },
  onActivated: (context, state, self) => {
    // スキルが有効化した瞬間にスキル発動
    return triggerSkillAtEvent(
      context,
      state,
      self,
      {
        probability: self.skill.property.readNumber("probability"),
        type: "skill_event",
        recipe: (state) => {
          const target = state.formation.filter(d => {
            const s = d.skill
            return s.type === "possess" && s.transition.state === "cooldown"
          })
          assert(target.length > 0, `cooldownスキル状態が見つかりません`)

          const names = target.map(d => d.firstName).join(",")
          context.log.log(`クールタイム解除:${names}`)

          target.forEach(d => {
            const s = d.skill
            assert(s.type === "possess" && s.transition.state === "cooldown")
            s.transition = {
              // transitionタイプによってスキル状態の処理は異なる
              // 未初期化に戻してrefreshStateで初期化することでcooldown状態を強制終了する
              state: "not_init",
              data: undefined
            }
          })

        }
      }
    )
  },
}

export default skill