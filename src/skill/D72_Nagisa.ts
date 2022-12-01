import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_fixed" && self.who === "offense") {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          const count = [
            ...state.offense.formation,
            ...state.defense!.formation,
          ].filter(d => d.attr === "cool").length
          const maxCount = self.skill.property.readNumber("max_count")
          const maxDamage = self.skill.property.readNumber("max_damage")
          const damage = Math.floor(maxDamage * Math.pow(count / maxCount, 2))
          state.damageFixed += damage
          context.log.log(`クールな子たちに囲まれてるとテンションが上がっちゃうんです！ 固定ダメージ:${damage}`)
        }
      }
    }
  }
}

export default skill