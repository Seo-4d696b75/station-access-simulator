import { addDamage, getAccessDenco, invertAccessSide } from "../core/access";
import { assert } from "../core/context";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessAfterDamage: (context, state, self) => {
    if (self.reboot) {
      const damage = self.damage?.value
      assert(damage)
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "skill_recipe",
        recipe: (state) => {
          // アクセスしてきた相手、もしくはアクセスした相手
          // カウンターによるダメージの場合は攻撃側の場合もある
          const d = getAccessDenco(state, invertAccessSide(self.which))
          // カウンターによるダメージの場合、
          // 相手に既にダメージが存在する可能性あがある
          d.damage = addDamage(d.damage, {
            value: damage,
            attr: false,
          })
          context.log.log(`まりかカウンター 対象:${d.firstName} damage:${damage}`)
        }
      }
    }
  }
}

export default skill