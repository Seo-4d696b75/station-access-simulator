import { getFormation, SkillLogic, triggerSkillAfterAccess } from "..";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessComplete: (context, access, self) => {
    // スキルによる経験値追加(固定値)は配布対象外
    // ただしフィルム・スキルによる獲得経験値増加量は影響する
    const accessExp = self.exp.access.total
    const linkExp = self.exp.link
    const exp = accessExp + linkExp // 再配布の対象経験値
    const formation = getFormation(access, self.which)
    if (exp > 0 && formation.length >= 2) {
      // 再配布対象が存在すること
      const idx = (self.carIndex === 0) ? 1 : 0
      let target = formation[idx]
      // 再配布できる場合
      if (target.currentExp < target.nextExp) {
        return triggerSkillAfterAccess(
          context,
          access,
          self,
          {
            probability: self.skill.property.readNumber("probability", 100),
            type: "skill_event",
            recipe: (state) => {
              const percent = self.skill.property.readNumber("EXP")
              let dst = state.formation[idx] // 編成位置は変わらない前提
              const value = Math.floor(exp * percent / 100)
              context.log.log(`経験値の再配布 ${exp} * ${percent}% = ${value}`)
              dst.currentExp += value // アクセス中と異なる直接加算する
              // レベルアップの確認等の更新は呼び出し元で行う（はず）
            }
          }
        )
      }
    }
  }
}

export default skill