import { DencoType } from "../core/denco";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    // 単独編成では発動しない
    if (step === "damage_common" && self.who === "offense" && state.offense.formation.length > 1) {
      return {
        probability: self.skill.property.readNumber("probability"),
        recipe: (state) => {
          // 自身を除くタイプの数
          const types = new Set<DencoType>()
          state.offense.formation
            .filter(d => d.numbering !== self.numbering)
            .forEach(d => types.add(d.type))
          const unit = self.skill.property.readNumber("ATK")
          const atk = unit * types.size
          state.attackPercent += atk
          context.log.log(`いろんなタイプのでんこといるほうが、感受性が磨かれる気がする DEF:+${atk}`)
        }
      }
    }
  }
}

export default skill