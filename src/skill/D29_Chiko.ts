import { getAccessDenco, SkillLogic } from "..";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamageSpecial: (context, state, self) => {
    if (self.who === "offense") {
      // 通常のダメージ計算で相手をリブートさせるか否かは考慮されない
      // 場合によってはダメージ量が減少する

      // 相手のHPと同じダメージ量に固定
      const hp = getAccessDenco(state, "defense").currentHp
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_special",
        // FIXME
        // 固定ダメージ追加・軽減が同時に発動した場合、軽減は反映されない？
        // https://github.com/Seo-4d696b75/station-access-simulator/issues/27
        damageCalc: {
          variable: 0,
          constant: hp,
        }
      }
    }
  }
}

export default skill