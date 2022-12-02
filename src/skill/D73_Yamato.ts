import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_fixed" && self.which === "defense") {
      // アクセス・被アクセスでんこの属性に依存
      const offense = getAccessDenco(state, "offense")
      const defense = getAccessDenco(state, "defense")
      if (offense.attr === defense.attr) {
        return {
          probabilityKey: "probability",
          recipe: (state) => {
            const damage = self.skill.property.readNumber("damage_fixed")
            state.damageFixed += damage
            context.log.log(`スキルでもいろんなでんこちゃんの役に立てたらなってー 固定ダメージ:${damage}`)
          }
        }
      }
    }
  }
}

export default skill