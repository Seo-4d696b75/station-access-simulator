import { calcAccessDamage, getBaseDamage, getDefense, SkillLogic } from "..";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_special" &&
      self.which === "defense" &&
      self.who !== "defense" &&
      self.currentHp > 1) {
      const base = getBaseDamage(context, state)
      // 肩代わりできるダメージの有無を確認
      if (base.variable > 0) {
        return {
          probability: self.skill.property.readNumber("probability"),
          recipe: (state) => {
            // ATKのみ考慮して基本ダメージを計算
            const base = calcAccessDamage(context, state, {
              useATK: true,
              useDEF: false,
              useAttr: false,
            })
            const cut = Math.min(self.currentHp - 1, base)
            if (cut <= 0) {
              context.log.error(`肩代わりするダメージ量が0以下です`)
            }
            // DEF, 属性ダメージ補正をあとから乗算
            const def = state.defendPercent
            const ratio = state.damageRatio
            const damage = Math.max(
              Math.floor((base - cut) * (1 - def / 100) * ratio),
              1 // 最低1ダメージ分は確保
            )
            context.log.log(`ミオのダメージ肩代わり damage:${cut}, HP:${self.currentHp} => ${self.currentHp - cut}`)
            context.log.log(`ダメージ計算 base:${base} = AP * (1 + ATK%), DEF:${def}%, damage:${damage} = max{1, (base - ${cut}) * ${100 - def}% * ${ratio}}`)
            // 肩代わり後のダメージ量で上書き
            state.damageBase = {
              variable: damage,
              constant: 0
            }
            // ミオにダメージ記録
            getDefense(state).formation[self.carIndex].damage = {
              value: cut,
              attr: false
            }
          }
        }
      }
    }
  },
  deactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = context.currentTime
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000,
    }
  }
}

export default skill