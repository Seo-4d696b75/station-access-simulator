import { getAccessDenco, SkillLogic } from "..";

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    // 移動距離1km未満は発動しない?
    return step === "start_access" &&
      self.which === "offense" &&
      state.defense !== undefined &&
      state.offense.user.dailyDistance >= 1.0
  },
  evaluate: (context, state, step, self) => {
    const dist = state.offense.user.dailyDistance
    const distMax = self.skill.propertyReader("distMax")
    const expMax = self.skill.propertyReader("expMax")
    const expDist = Math.floor(expMax * Math.min(1.0, dist / distMax))
    const expFixed = dist >= distMax ? self.skill.propertyReader("expFixed") : 0
    const accessDenco = getAccessDenco(state, "offense")
    accessDenco.exp.skill += expDist
    if (expFixed > 0) {
      state.offense.formation.forEach(d => {
        d.exp.skill += expFixed
      })
    }
    context.log.log(`経験値付与 ${accessDenco.name}:${expDist}(${dist}/${distMax}km), 編成内:${expFixed}(${distMax}km以上)`)
    return state
  }
}

export default skill