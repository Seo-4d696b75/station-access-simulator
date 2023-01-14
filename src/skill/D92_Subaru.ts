import { getAccessDenco } from "../core/access";
import { DencoType } from "../core/denco";
import { formatPercent } from "../core/format";
import { SkillLogic, SkillProperty } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "other") {
      const idx = (self.carIndex === 0) ? 1 : 0
      const d = getAccessDenco(state, self.which)
      if (idx !== d.carIndex) return
      const [atk, def] = readAtkDef(d.type, self.skill.property)
      if (self.which === "offense" && atk > 0) {
        return {
          probability: "probability", // 100%
          recipe: (state) => {
            state.attackPercent += atk
            context.log.log(`でんこも好き。みんな個性があるんだ。ATK${formatPercent(atk)}`)
          }
        }
      }
      if (self.which === "defense" && def > 0) {
        return {
          probability: "probability", // 100%
          recipe: (state) => {
            state.defendPercent += def
            context.log.log(`でんこも好き。みんな個性があるんだ。DEF${formatPercent(def)}`)
          }
        }
      }
    }
  }
}

function readAtkDef(type: DencoType, props: SkillProperty): [number, number] {
  switch (type) {
    case "attacker":
    case "trickster":
      return [
        props.readNumber("ATK"),
        0
      ]
    case "defender":
    case "supporter":
      return [
        0,
        props.readNumber("DEF")
      ]
  }
}

export default skill