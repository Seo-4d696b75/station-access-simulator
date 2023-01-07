import { getAccessDenco } from "../core/access";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense") {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          let atk = self.skill.property.readNumber("ATK")
          if (getAccessDenco(state, "defense").attr === "eco") {
            atk += self.skill.property.readNumber("ATK_eco")
          }
          state.attackPercent += atk
          context.log.log(`このワタシの手にかかれば楽勝だしATK${formatPercent(atk)}`)
        }
      }
    }
  }
}

export default skill