import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    // 相手不在・足湯は対象外
    if (
      step === "start_access"
      && self.which === "offense"
      && !state.pinkMode
      && state.defense
    ) {
      const cnt = state.offense.user.daily.readAccessStationCount(context)
      const cntMax = self.skill.property.readNumber("max_access_count")
      return {
        probability: Math.floor(100 * Math.min(cnt, cntMax) / cntMax),
        recipe: (state) => {
          const d = getAccessDenco(state, "offense")
          let exp = self.skill.property.readNumber("exp")
          if (d.attr === "cool") {
            exp += self.skill.property.readNumber("exp_cool")
          }
          d.exp.skill += exp
          context.log.log(`何が起こるかわかんないのが一番楽しいよね～? 経験値追加 ${d.name} +${exp}`)
        }
      }
    }
  }
}

export default skill