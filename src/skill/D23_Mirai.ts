import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense") {
      return self.skill.property.readNumber("probability")
    }
    return false
  },
  evaluate: (context, state, step, self) => {
    const lower = self.skill.property.readNumber("ATK_lower")
    const upper = self.skill.property.readNumber("ATK_upper")
    const atk = lower + Math.floor((upper - lower) * context.random())
    state.attackPercent += atk
    context.log.log(`私のスキルってやる気でダメージが変わっちゃうんだって ATK${new Intl.NumberFormat("en-US", { signDisplay: "always" }).format(atk)}`)
    return state
  }
}

export default skill