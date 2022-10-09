import { evaluateSkillAfterAccess, SkillLogic } from "..";
import { EventSkillTrigger } from "../core/skillEvent";


const skill: SkillLogic = {
  onAccessComplete: (context, state, self, access) => {
    const accessExp = self.exp.access // 他スキルによる経験値は対象外
    const linkExp = self.exp.link
    const exp = accessExp + linkExp // 再配布の対象経験値
    if (exp > 0 && state.formation.length >= 2) {
      // 再配布対象が存在すること
      const idx = (self.carIndex === 0) ? 1 : 0
      let target = state.formation[idx]
      // 再配布できる場合
      if (target.currentExp < target.nextExp) {
        return evaluateSkillAfterAccess(context, state, self, (state) => {
          const percent = self.skill.property.readNumber("EXP")
          let dst = state.formation[idx] // 編成位置は変わらない前提
          const value = Math.floor(exp * percent / 100)
          context.log.log(`経験値の再配布 ${exp} * ${percent}% = ${value}`)
          dst.currentExp += value // アクセス中と異なる直接加算する
          // レベルアップの確認等の更新は呼び出し元で行う（はず）
        })
      }
    }
  }
}

export default skill