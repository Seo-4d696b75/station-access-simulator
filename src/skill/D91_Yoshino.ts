import { getAccessDenco } from "../core/access";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    // DEFの増減
    if (step === "damage_common" && self.who === "defense") {
      const d = getAccessDenco(state, "offense")
      if (d.attr === "cool") {
        return {
          probability: "probability_def", // 100%
          recipe: (state) => {
            const def = self.skill.property.readNumber("DEF_cool")
            state.defendPercent += def
            context.log.log(`寒いのにはとても強いんです DEF${formatPercent(def)}`)
          }
        }
      } else if (d.attr === "heat") {
        return {
          probability: "probability_def", // 100%
          recipe: (state) => {
            const def = self.skill.property.readNumber("DEF_heat")
            state.defendPercent += def
            context.log.log(`暑いのだけはどうにも苦手で DEF${formatPercent(def)}`)
          }
        }
      }
    }
    // 被アクセス時のスコア・経験値追加
    if (
      step === "after_damage"
      && self.who === "defense"
      && !self.reboot
    ) {
      return {
        probability: "probability_exp",
        recipe: (state) => {
          const exp = self.skill.property.readNumber("exp")
          const score = self.skill.property.readNumber("score")
          context.log.log(`被アクセスでリブートしませんでした exp+${exp} score+${score}`)
          const user = state.defense!
          const d = user.formation[self.carIndex]
          d.exp.skill += exp
          user.score.skill += score
        }
      }
    }
  }
}

export default skill