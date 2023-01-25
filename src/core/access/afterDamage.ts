import { AccessSide, AccessState, getFormation, getSide } from "."
import { Context } from "../context"
import { updateDencoHP } from "./hp"
import { hasSkillTriggered, triggerSkillOnSide } from "./_skill"


interface AfterDamageSkillEntry {
  carIndex: number,
  hp: number
}

function _triggerSkillAfterDamage(
  context: Context,
  state: AccessState,
  offenseQueue: AfterDamageSkillEntry[] | undefined,
  defenseQueue: AfterDamageSkillEntry[] | undefined,
  which: AccessSide,
): AccessState {
  // 終了条件
  // 攻撃・守備側ともに検査対象が0件
  if (offenseQueue?.length === 0 && defenseQueue?.length === 0) {
    return state
  }
  // 検査対象の選択
  let queue = which === "offense" ? offenseQueue : (
    // 相手不在の場合は検査対象は0件
    state.defense ? defenseQueue : []
  )
  // 検査対象の更新
  if (!queue) {
    const formation = getFormation(state, which)
    // 初期化（編成内全員を確認）
    queue = formation.map(d => ({
      carIndex: d.carIndex,
      hp: d.hpAfter
    }))
  } else if (queue.length > 0) {
    const side = getSide(state, which)
    // 前回の発動判定時と比べて まだ発動していない＆HPの変化があった
    queue = queue.filter(e => {
      let self = side.formation[e.carIndex]
      let hasTriggered = hasSkillTriggered(state, self.which, self)
      let hpChanged = (e.hp !== self.hpAfter)
      return !hasTriggered && hpChanged
    })
    if (queue.length > 0) {
      context.log.log("スキルの評価中にHPが変化したでんこがいます")
      queue = queue.map(e => {
        let self = side.formation[e.carIndex]
        context.log.log(`  denco:${self.name} HP:${e.hp} => ${self.hpAfter}`)
        return {
          carIndex: e.carIndex,
          hp: self.hpAfter
        }
      })
      context.log.log("スキルを再度評価：ダメージ計算完了後")
    }
  }
  // 検査
  if (queue.length > 0) {
    // スキル発動（必要なら）
    state = triggerSkillOnSide(
      context,
      state,
      which,
      "onAccessAfterDamage",
      queue.map(e => e.carIndex)
    )
    // HPの決定 & HP0 になったらリブート
    // 全員確認する
    updateDencoHP(context, state, "offense")
    updateDencoHP(context, state, "defense")
  }
  // 次の検査
  if (which === "offense") {
    return _triggerSkillAfterDamage(
      context,
      state,
      queue,
      defenseQueue,
      "defense"
    )
  } else {
    return _triggerSkillAfterDamage(
      context,
      state,
      offenseQueue,
      queue,
      "offense"
    )
  }
}

export function triggerSkillAfterDamage(context: Context, state: AccessState): AccessState {

  context.log.log("アクセス結果を仮決定")
  context.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
  if (state.defense) {
    context.log.log(`守備側のリンク解除：${state.linkDisconnected}`)
  } else {
    context.log.log(`守備側のリンク解除：不在`)
  }

  context.log.log("スキルを評価：ダメージ計算完了後")

  return _triggerSkillAfterDamage(
    context,
    state,
    undefined,
    undefined,
    "offense"
  )
}