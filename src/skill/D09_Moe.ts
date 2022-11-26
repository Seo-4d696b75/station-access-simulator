import { triggerSkillAtEvent } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "auto-condition",
  canActivated: (context, state, self) => {
    const idx = state.formation.findIndex(d => d.currentHp < d.maxHp)
    return idx >= 0
  },
  onHourCycle: (context, state, self) => {
    return triggerSkillAtEvent(context, state, self, {
      probabilityKey: "probability",
      recipe: (state) => {
        const heal = self.skill.property.readNumber("heal")
        context.log.log(`編成内のみなさまのHPを回復いたしますよ♪ +${heal}%`)
        state.formation.forEach(d => {
          if (d.currentHp < d.maxHp) {
            const v = Math.min(Math.floor(d.currentHp + d.maxHp * heal / 100.0), d.maxHp)
            context.log.log(`HPの回復 ${d.name} ${d.currentHp} > ${v}`)
            d.currentHp = v
          }
        })
      },
    })
  }
}

export default skill