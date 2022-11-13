import { getAccessDenco, SkillLogic } from "..";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    // 移動距離1km未満は発動しない?
    const dist = state.offense.user.daily.readDistance(context)
    if (step === "start_access"
      && self.which === "offense"
      && state.defense
      && !state.pinkMode
      && dist >= 1.0) {
      return (state) => {
        const distMax = self.skill.property.readNumber("distMax")
        const expMax = self.skill.property.readNumber("expMax")
        const expDist = Math.floor(expMax * Math.min(1.0, dist / distMax))
        const expFixed = dist >= distMax ? self.skill.property.readNumber("expFixed") : 0
        const accessDenco = getAccessDenco(state, "offense")
        accessDenco.exp.skill += expDist
        if (expFixed > 0) {
          state.offense.formation.forEach(d => {
            d.exp.skill += expFixed
          })
        }
        context.log.log(`経験値付与 ${accessDenco.name}:${expDist}(${dist}/${distMax}km), 編成内:${expFixed}(${distMax}km以上)`)
      }
    }
  }
}

export default skill