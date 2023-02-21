import { SkillLogic } from "..";
import { LocalDateType } from "../core/user/property";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessStart: (context, state, self) => {
    // 移動距離1km未満は発動しない?
    const dist = state.offense.user.getDailyDistance(LocalDateType.Today)
    if (
      self.which === "offense"
      && state.defense
      && !state.pinkMode
      && dist >= 1.0
    ) {
      const distMax = self.skill.property.readNumber("distMax")
      const expMax = self.skill.property.readNumber("expMax")
      const expDist = Math.floor(expMax * Math.min(1.0, dist / distMax))
      const expFixed = dist >= distMax ? self.skill.property.readNumber("expFixed") : 0
      context.log.log(`経験値付与 アクセス:${expDist}(${dist}/${distMax}km), 編成内:${expFixed}(${distMax}km以上)`)

      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "exp_delivery",
        exp: (d) => d.who === "offense"
          ? expDist + expFixed // アクセス本人
          : d.which === "offense"
            ? expFixed // 編成内
            : 0
      }
    }
  }
}

export default skill