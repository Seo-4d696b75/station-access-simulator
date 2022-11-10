import { getAccessDenco } from "../core/access/index";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (self.who === "offense"
      && state.defense !== undefined) {
      if (step === "damage_common") {
        return (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`おっけ～おっけ～なんとかなるなる～ ATK+${atk}%`)
        }
      }
      if (step === "after_damage") {
        const d = getAccessDenco(state, "defense")
        if (d.hpAfter > 0) {
          return (state) => {
            const defense = getAccessDenco(state, "defense")
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
  },
}

export default skill