import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    // 移動距離1km未満は発動しない?
    const dist = state.offense.user.daily.readDistance(context)
    if (step === "damage_common" && self.which === "offense" && dist >= 1) {
      const th = self.skill.property.readNumber("dist")
      if (self.who === "offense" || dist >= th) {
        return {
          probabilityKey: "probability",
          recipe: (state) => {
            if (self.who === "offense") {
              const perDist = self.skill.property.readNumber("ATK_self")
              const atk = perDist * Math.min(th, Math.floor(dist))
              state.attackPercent += atk
              context.log.log(`おでかけするときは手をつながなきゃダメだぜ！（自身）ATK${formatPercent(atk)} (${perDist}% x ${Math.floor(dist)}km)`)
            }
            if (dist >= th) {
              const atk = self.skill.property.readNumber("ATK_other")
              state.attackPercent += atk
              context.log.log(`オレと手をつないでると、絆の力でみーんなつよくなるんだぜ！（編成内）ATK${formatPercent(atk)}`)
            }
          }
        }
      }
    }
  }
}

export default skill