import { assert, calcAccessDamage, formatPercent, getBaseDamage, getDefense, SkillLogic } from "..";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamageSpecial: (context, state, self) => {
    if (
      self.which === "defense"
      && self.who !== "defense"
      && self.currentHp > 1
    ) {

      const base = getBaseDamage(context, state)
      // 肩代わりできるダメージの有無を確認
      if (base.variable <= 0) return

      // ATKのみ考慮して基本ダメージを計算
      const damageATK = calcAccessDamage(context, state, {
        useATK: true,
        useDEF: false,
        useAttr: false,
      })
      const cut = Math.min(self.currentHp - 1, damageATK)

      assert(cut > 0, `肩代わりするダメージ量が0以下です`)

      // DEF, 属性ダメージ補正をあとから乗算
      const def = state.defendPercent
      const ratio = state.damageRatio
      const damageDEF = Math.max(
        Math.floor((damageATK - cut) * (1 - def / 100) * ratio),
        1 // 最低1ダメージ分は確保
      )
      context.log.log(`ミオのダメージ肩代わり damage:${cut}, HP:${self.currentHp} => ${self.currentHp - cut}`)
      context.log.log(`ダメージ計算 base:${base} = AP * (1 + ATK%), DEF:${formatPercent(def)}, damage:${damageDEF} = max{1, (base - ${cut}) * ${formatPercent(100 - def)} * ${ratio}}`)

      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_special",
        damageCalc: {
          // 肩代わり後のダメージ量で上書き
          variable: damageDEF,
          constant: 0
        },
        sideEffect: (state) => {
          // ミオにダメージ記録
          const d = getDefense(state).formation[self.carIndex]
          assert(!d.damage)
          d.damage = {
            value: cut,
            attr: false
          }
        }
      }
    }
  }
}

export default skill