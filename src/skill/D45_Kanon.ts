import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "offense" && state.defense) {
      const targetIdx = self.carIndex === 0 ? 1 : 0
      const d = getAccessDenco(state, "offense")
      if (d.carIndex === targetIdx) {
        return (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`マスター、あとちょっとだけ頑張ってリンクしてみよ♪ ATK+${atk}%`)
        }
      }
    }
  },
  deactivate: "default_timeout"
}

export default skill