import { getAccessDenco } from "../core/access";
import { DencoType } from "../core/denco";
import { SkillLogic, SkillProperty } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "other") {
      const idx = (self.carIndex === 0) ? 1 : 0
      const d = getAccessDenco(state, self.which)
      if (idx !== d.carIndex) return
      const [atk, def] = readAtkDef(d.type, self.skill.property)
      if (self.which === "offense" && atk > 0) {
        return {
          probability: self.skill.property.readNumber("probability"), // 100%
          type: "damage_atk",
          percent: atk,
        }
      }
      if (self.which === "defense" && def > 0) {
        return {
          probability: self.skill.property.readNumber("probability"), // 100%
          type: "damage_def",
          percent: def,
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