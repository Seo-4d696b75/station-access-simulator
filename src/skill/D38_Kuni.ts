import { counterAttack, getAccessDenco, getSide, hasSkillTriggered } from "../core/access";
import { assert } from "../core/context";
import { triggerSkillAfterAccess } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
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
        // アクセス中に発動するのはカウンターのみ
        // HP回復はアクセス直後のタイミング（青色ダイアログ表示される）
        // 実装的には姉の被アクセス時に確率でカウンター、カウンターと同時にHPも回復
        return {
          probability: "probability",
          recipe: (state) => {
            context.log.log(`お姉様との旅路を邪魔するやつは、たとえマスターでも許さないからな…！！カウンター発動`)
            return counterAttack(context, state, self)
          }
        }
      }
    }
  },
  onAccessComplete: (context, state, self, access) => {
    const side = getSide(access, self.which)
    const idx = side.formation.findIndex(d => d.numbering === "37")
    assert(idx >= 0)
    // カウンター発動した場合はHPも回復
    if (hasSkillTriggered(side, self)) {
      return triggerSkillAfterAccess(
        context,
        state,
        self,
        {
          probability: "probability_heal", // 100%
          recipe: (state) => {
            const sister = state.formation[idx]
            assert(sister.numbering === "37")
            assert(sister.currentHp < sister.maxHp)
            // HPを直接いじる
            const percent = self.skill.property.readNumber("heal")
            const heal = Math.floor(sister.maxHp * percent / 100)
            sister.currentHp = Math.min(
              sister.currentHp + heal,
              sister.maxHp,
            )
            context.log.log(`お姉様は身体が弱い……。HP+${heal}`)
          }
        },
      )
    }
  }
}

export default skill