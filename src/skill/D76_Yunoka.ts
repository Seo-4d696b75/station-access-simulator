import { getAccessDenco } from "../core/access/index";
import { assert } from "../core/context";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      return {
        probability: self.skill.property.readNumber("probability_atk"),
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  },
  onAccessAfterDamage: (context, state, self) => {
    if (
      self.who === "offense"
      && state.defense
      && !state.pinkMode
    ) {
      // 相手のHPを0にできなかった場合
      const d = getAccessDenco(state, "defense")
      if (d.hpAfter > 0) {
        return {
          probability: self.skill.property.readNumber("probability_heal"),
          type: "skill_recipe",
          recipe: (state) => {
            const defense = getAccessDenco(state, "defense")
            const percent = self.skill.property.readNumber("heal")
            // 相手の最大HPの特定割合を回復
            //   参考：https://twitter.com/koh_nohito/status/1091286742550736896
            //   スキルの説明や公式の文言では何の値の割合なのか明記なし
            // ただし与えたダメージ量はそのままなので、合計では正のダメージ量となる場合もある
            const heal = Math.floor(defense.maxHp * percent / 100)
            // ダメージ計算は既に完了しているのでダメージ量に直接加算する
            const damage = defense.damage
            assert(damage, `相手のダメージ量が計算されていません ${defense.name}`)
            context.log.log(`回復:${heal} = maxHP:${defense.maxHp} * ${percent}%`)
            context.log.log(`相手(${defense.name})のダメージ量:${damage.value - heal} = ${damage.value} - 回復:${heal}`)
            defense.damage = {
              value: damage.value - heal,
              attr: damage.attr,
            }
          }
        }
      }
    }
  }
}

export default skill