import { getAccessDenco } from "../core/access";
import { FilmHolder } from "../core/film";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common") {
      // 直接アクセスする・アクセス受けるでんこ
      const d = getAccessDenco(state, self.which)
      // みずほと同種のフィルムを着用している（本人も含む）
      if (getFilmTheme(d.film) === getFilmTheme(self.film)) {
        return {
          probabilityKey: "probability",
          recipe: (state) => {
            if (self.which === "offense") {
              const atk = self.skill.property.readNumber("ATK")
              state.attackPercent += atk
              context.log.log(`同じフィルムを着ているでんこさんは、きっとお仲間だと思うのです…… ATK${formatPercent(atk)}`)
            } else {
              const def = self.skill.property.readNumber("DEF")
              state.defendPercent += def
              context.log.log(`同じフィルムを着ているでんこさんは、きっとお仲間だと思うのです…… DEF${formatPercent(def)}`)
            }
          }
        }
      }
    }
  }
}

function getFilmTheme(f: FilmHolder): string | undefined {
  // いつものフィルムも対象
  if (f.type === "none") return undefined
  return f.theme
}

export default skill