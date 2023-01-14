import { addDamage, getAccessDenco } from "../core/access";
import { assert } from "../core/context";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "after_damage" && self.reboot) {
      const damage = self.damage?.value
      assert(damage)
      return {
        probability: "probability",
        recipe: (state) => {
          // アクセスしてきた相手、もしくはアクセスした相手
          // カウンターによるダメージの場合は攻撃側の場合もある
          const d = getAccessDenco(state, self.which === "defense" ? "offense" : "defense")
          // カウンターによるダメージの場合、
          // 相手に既にダメージが存在する可能性あがある
          d.damage = addDamage(d.damage, {
            value: damage,
            attr: false,
          })
          context.log.log(`あんまりお姉さんをナメると痛い目みるわよ？ でんこ:${d.name} damage:${damage}`)
        }
      }
    }
  },
}

export default skill