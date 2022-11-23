import { getAccessDenco, getDefense } from "../core/access";
import { Film } from "../core/film";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.which === "defense") {
      // 自身のDEFは増加しない
      if (self.who === "defense") return
      // アクセスを受けるでんこが着用するフィルム
      const d = getAccessDenco(state, "defense")
      if (d.film.type !== "film") return
      const theme = d.film.theme
      // 同じテーマのフィルムの数（ひまりを除く）
      const filmThemeMap = new Map<string, number>()
      getDefense(state)
        .formation
        .filter(d => d.name !== self.name) // ひまりをカウントから除く
        .map(d => d.film)
        .filter((f): f is Film => f.type === "film") // フィルム着用限定
        .map(f => f.theme)
        .forEach(name => {
          const cnt = filmThemeMap.get(name) ?? 0
          filmThemeMap.set(name, cnt + 1)
        })
      // フィルム着用０人
      if (filmThemeMap.size === 0) return
      // 同種フィルムの最大着用数
      const maxCnt = Array.from(filmThemeMap.values())
        .reduce((a, b) => Math.max(a, b))
      // アクセスをうけるでんこ着用フィルムが同種最大数か？
      if (filmThemeMap.get(theme) !== maxCnt) return
      return (state) => {
        const unit = self.skill.property.readNumber("DEF")
        const def = unit * maxCnt
        state.defendPercent += def
        context.log.log(`みんなで同じフィルムを着ると、いいことがあるんだよ♪ DEF${formatPercent(def)}`)
        context.log.log(`  フィルム：${theme}, DEF = ${unit}% * ${maxCnt}`)
      }
    }
  }
}

export default skill