import { getAccessDenco } from "../core/access/index";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      const offense = getAccessDenco(state, "offense")
      if (offense.ap > self.ap) {
        return (state) => {
          const maxDEF = self.skill.property.readNumber("DEF")
          const def = Math.floor(maxDEF * (offense.ap - self.ap) / offense.ap)
          state.defendPercent += def
          context.log.log(`DEF:${def}% = Max:${maxDEF}% * (offenseAP:${offense.ap} - selfAP:${self.ap}) / ${offense.ap}`)
        }
      }
    }
  },
  deactivate: "default_timeout"
}

export default skill