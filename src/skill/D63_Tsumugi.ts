import { getFormation } from "../core/access";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common") {
      // cooldownのスキルの数
      const cnt = getFormation(state, self.which)
        .filter(d => d.skill.type === "possess" && d.skill.transition.state === "cooldown")
        .length
      if (cnt > 0) {
        return {
          probabilityKey: "probability",
          recipe: (state) => {
            if (self.which === "offense") {
              const unit = self.skill.property.readNumber("ATK")
              const atk = unit * cnt
              state.attackPercent += atk
              context.log.log(`あたしは出会うお手伝いができたら満足かなぁ ATK${formatPercent(atk)}(${unit}% x ${cnt})`)
            } else {
              const unit = self.skill.property.readNumber("DEF")
              const def = unit * cnt
              state.defendPercent += def
              context.log.log(`あたしは出会うお手伝いができたら満足かなぁ DEF${formatPercent(def)}(${unit}% x ${cnt})`)
            }
          }
        }
      }
    }
  }
}

export default skill