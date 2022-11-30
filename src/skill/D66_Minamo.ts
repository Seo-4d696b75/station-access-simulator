import { activateSkill, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "auto",
  deactivate: "default_timeout",
  onLinkStarted: (context, state, self, link) => {
    if (self.skill.transition.state !== "unable") return
    // 自身を除いてリンク数をカウント
    const linkCount = state.formation
      .filter(d => d.name !== self.name)
      .map(d => d.link.length)
      .reduce((a, b) => a + b)
    const linkCountTh = self.skill.property.readNumber("link_count")
    if (linkCount >= linkCountTh) {
      // 条件を満たしたら自動で有効化
      return activateSkill(context, state, self.carIndex)
    }
  },
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_fixed" && self.who === "offense") {
      return {
        probabilityKey: "probability",
        recipe: (state) => {
          const damage = self.skill.property.readNumber("damage_fixed")
          state.damageFixed += damage
          context.log.log(`みんなでがんばればそれだけ強くなる……ってステキですよね！ 固定ダメージ + ${damage}`)
        }
      }
    }
  }
}

export default skill