import { counterAttack, getAccessDenco, getSide, hasSkillTriggered } from "../core/access";
import { assert } from "../core/context";
import { triggerSkillAfterAccess } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessAfterDamage: (context, state, self) => {
    // みことのリブート有無は通常ダメージ計算＋固定ダメージ計算が終わるまで分からない
    if (
      self.which === "defense"
      && self.who === "other"
    ) {
      const d = getAccessDenco(state, "defense")
      const hpTh = self.skill.property.readNumber("HP_TH")
      // みこと限定・リブート無し・HPが特定比率以下
      if (
        d.numbering === "37"
        && !d.reboot
        && d.hpAfter <= d.maxHp * hpTh / 100
      ) {
        // アクセス中に発動するのはカウンターのみ
        // HP回復はアクセス直後のタイミング（青色ダイアログ表示される）
        // 実装的には姉の被アクセス時に確率でカウンター、カウンターと同時にHPも回復
        return {
          probability: self.skill.property.readNumber("probability"),
          type: "after_recipe",
          recipe: (state) => counterAttack(context, state, self),
        }
      }
    }
  },
  onAccessComplete: (context, access, self) => {
    const side = getSide(access, self.which)
    const idx = side.formation.findIndex(d => d.numbering === "37")
    assert(idx >= 0)
    // カウンター発動した場合はHPも回復
    if (hasSkillTriggered(access, self.which, self)) {
      return triggerSkillAfterAccess(
        context,
        access,
        self,
        {
          probability: self.skill.property.readNumber("probability_heal", 100), // 100%
          type: "skill_event",
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
            context.log.log(`みことHP回復 +${heal}`)
          }
        },
      )
    }
  }
}

export default skill