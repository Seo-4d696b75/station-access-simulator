import { SkillLogic } from "../core/skill";


const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessBeforeStart: (context, state, self) => {
    if (self.who === "offense" && state.defense && !state.pinkMode) {
      // TODO 無効化対象のでんこを列挙する 適宜変更が必要
      const target = self.skill.property.readStringArray("invalidated")
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "invalidate_skill",
        isTarget: (d) => d.who === "defense" && target.includes(d.numbering)
      }
    }
  }
}

export default skill