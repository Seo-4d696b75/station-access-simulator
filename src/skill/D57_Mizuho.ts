import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    // 直接アクセスする・アクセス受けるでんこ
    const d = getAccessDenco(state, self.which)
    // みずほと同種のフィルムを着用している（本人も含む）
    const filmTheme = d.film.type === "none" ? undefined : d.film.theme
    const selfFilmTheme = self.film.type === "none" ? undefined : self.film.theme
    if (filmTheme === selfFilmTheme) {
      if (self.which === "offense") {
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "damage_atk",
          percent: self.skill.property.readNumber("ATK")
        }
      } else {
        return {
          probability: self.skill.property.readNumber("probability", 100),
          type: "damage_def",
          percent: self.skill.property.readNumber("DEF")

        }
      }
    }
  }
}

export default skill