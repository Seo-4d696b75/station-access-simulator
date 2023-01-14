import { getDefense } from "../core/access";
import { countDencoType } from "../core/denco";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense") {
      return {
        probability: "probability",
        recipe: (state) => {
          const cnt = countDencoType(getDefense(state).formation)
          const unit = self.skill.property.readNumber("ATK")
          const atk = unit * cnt
          state.attackPercent += atk
          context.log.log(`いろんなでんこに会えると、嬉しくなって勢いあまっちゃうんだよ～ ATK${formatPercent(atk)}`)
        }
      }
    }
  }
}

export default skill