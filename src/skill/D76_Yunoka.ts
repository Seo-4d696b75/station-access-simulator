import { getAccessDenco } from "../core/access";
import { getCurrentTime } from "../core/context";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return (step === "damage_common" || step === "after_damage")
      && self.who === "offense"
      && state.defense !== undefined
  },
  evaluate: (context, state, step, self) => {
    if (step === "damage_common") {
      const atk = self.skill.property.readNumber("ATK")
      state.attackPercent += atk
      context.log.log(`おっけ～おっけ～なんとかなるなる～ ATK+${atk}%`)
    } else if (step === "after_damage") {
      const defense = getAccessDenco(state, "defense")
      if (defense.hpAfter > 0) {
        // 相手のHPを0にできなかった場合
        const percent = self.skill.property.readNumber("heal")
        // 相手の最大HPの特定割合を回復
        //   参考：https://twitter.com/koh_nohito/status/1091286742550736896
        //   スキルの説明や公式の文言では何の値の割合なのか明記なし
        // ただし与えたダメージ量はそのままなので、合計では正のダメージ量となる場合もある
        const heal = Math.floor(defense.maxHp * percent / 100)
        // ダメージ計算は既に完了しているのでダメージ量に直接加算する
        const damage = defense.damage
        if (!damage) {
          context.log.error(`相手のダメージ量が計算されていません ${defense.name}`)
          throw Error()
        }
        context.log.log(`会ったでんこにもポカポカしてほし～よね♪ 回復:${heal} = maxHP:${defense.maxHp} * ${percent}%`)
        context.log.log(`相手(${defense.name})のダメージ量:${damage.value - heal} = ${damage.value} - 回復:${heal}`)
        defense.damage = {
          value: damage.value - heal,
          attr: damage.attr,
        }
      }
    }
    return state
  },
  disactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = getCurrentTime(context)
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000,
    }
  },
}

export default skill