import { getAccessDenco } from "../core/access/index";
import { SkillLogic } from "../core/skill";


const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "before_access" && self.who === "offense" && state.defense && !state.pinkMode) {
      const defense = getAccessDenco(state, "defense")
      // TODO 無効化対象のでんこを列挙する 適宜変更が必要
      const target = self.skill.property.readStringArray("invalidated")
      if (target.includes(defense.numbering)) {
        return (state) => {
          const defense = getAccessDenco(state, "defense")
          defense.skillInvalidated = true
          context.log.log(`ウチのスキルは相手のスキルを無効化するでぇー target:${defense.name}`)
        }
      }
    }
  },
}

export default skill