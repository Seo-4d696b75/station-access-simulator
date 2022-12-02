import { getAccessDenco } from "../core/access";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if(step === "damage_common" && self.who === "offense") {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          // ATK増加
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          // 経験値追加
          const d = getAccessDenco(state, "defense")
          const exp = self.skill.property.readNumber("EXP")
          d.exp.skill += exp
          context.log.log(
            `生徒には『ねつ意』をもってせっしたい…\n` + 
            `  ATK${formatPercent(atk)}\n` +
            `  ${d.name} EXP +${exp}`
          )
        }
      }
    }
  }
}

export default skill