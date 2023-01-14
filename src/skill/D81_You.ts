import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";
import { NewStationType } from "../core/user/property";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    // 足湯は対象外
    if (
      step === "after_damage"
      && self.which === "offense"
      && state.linkSuccess
      && !state.pinkMode
      && getAccessDenco(state, "offense").attr === "heat"
    ) {
      return {
        probability: "probability",
        recipe: (state) => {
          let exp = self.skill.property.readNumber("EXP")
          context.log.log(`なんでもみんなで騒いで楽しむのがイチバン！経験値配布：${exp}`)
          const predicate = state.offense.user.history.isNewStation
          if (predicate(context, state.station) >= NewStationType.Daily) {
            const additional = self.skill.property.readNumber("EXP_additional")
            context.log.log(`  今日の新駅(${state.station.name}) 経験値追加：${additional}`)
            exp += additional
          }
          state.offense.formation.forEach(d => {
            d.exp.skill += exp
          })
        }
      }

    }
  }
}

export default skill