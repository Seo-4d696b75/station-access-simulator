import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";
import { NewStationType } from "../core/user/property";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessAfterDamage: (context, state, self) => {
    if (
      self.which === "offense"
      && state.linkSuccess
      && !state.pinkMode
      && getAccessDenco(state, "offense").attr === "heat"
    ) {
      const predicate = state.offense.user.isNewStation
      const isNew = predicate(context, state.station) >= NewStationType.Daily
      const exp = self.skill.property.readNumber("EXP")
        + (isNew ? self.skill.property.readNumber("EXP_additional") : 0)
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "exp_delivery",
        exp: (d) => d.which === "offense" ? exp : 0,
      }
    }
  },
}

export default skill