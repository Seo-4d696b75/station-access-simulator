import { addDamage, counterAttack, getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    // みことのリブート有無は通常ダメージ計算＋固定ダメージ計算が終わるまで分からない
    if (step === "after_damage"
      && self.which === "defense"
      && self.who === "other") {
      const d = getAccessDenco(state, "defense")
      const hpTh = self.skill.property.readNumber("HP_TH")
      // みこと限定・リブート無し・HPが特定比率以下
      if (d.numbering === "37"
        && !d.reboot
        && d.hpAfter <= d.maxHp * hpTh / 100) {
        return [
          {
            probability: self.skill.property.readNumber("probability"),
            recipe: (state) => {
              // HP回復は確率発動
              const sister = getAccessDenco(state, "defense")
              const percent = self.skill.property.readNumber("heal")
              const heal = Math.floor(sister.maxHp * percent / 100)
              sister.damage = addDamage(sister.damage, {
                // FIXME この実装だとお姉さまのHP回復量がアクセス表示ダイアログに反映されて現行仕様に反する
                // でも回復量がどこの表示にも反映されていない現行仕様の方が変？
                value: -heal, // 負数のダメージ量を加算
                attr: false,
              })
              context.log.log(`お姉様は身体が弱い……。HP+${heal}`)
            }
          },
          (state) => {
            context.log.log(`お姉様との旅路を邪魔するやつは、たとえマスターでも許さないからな…！！カウンター発動`)
            return counterAttack(context, state, self)
          }
        ]
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