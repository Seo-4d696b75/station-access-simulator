import { assert, Context, withFixedClock } from "../context";
import { DencoState } from "../denco";
import DencoManager from "../dencoManager";
import { LevelupEvent, refreshEventQueue } from "../event";
import SkillManager from "../skill";
import { refreshSkillState, refreshSkillStateOne } from "../skill/refresh";
import { copyState, copyStateTo, ReadonlyState } from "../state";
import { UserState } from "./state";

/**
 * 現在の編成状態を更新する
 * 
 * - 獲得経験値によるレベルアップ
 * - 現在時刻に応じたスキル状態の変更
 * - 現在時刻に応じて予約されたスキル発動型イベントを評価する
 * @param context 
 * @param state 現在の状態 引数に渡した現在の状態は変更されません
 * @returns 新しい状態 現在の状態をコピーしてから更新します
 */
export function refreshState(context: Context, state: ReadonlyState<UserState>): UserState {
  const next = copyState<UserState>(state)
  refreshUserState(context, next)
  return next
}

/**
 * 現在の編成状態を更新する（破壊的）
 * @param context 
 * @param state 
 */
export const refreshUserState = (context: Context, state: UserState) => withFixedClock(context, () => {
  refreshSkillState(context, state)
  refreshEventQueue(context, state)
  refreshEXPState(context, state)
})

/**
 * 現在の状態の経験値の確認してレベルアップ処理を行う(破壊的)
 * @param state 現在の状態
 * @returns 
 */
export function refreshEXPState(context: Context, state: UserState) {
  const indices = state.formation.map((_, idx) => idx)
  indices.forEach(idx => refreshEXPStateOne(context, state, idx))
}

/**
 * 指定した編成位置のでんこの経験値・レベルの状態を更新する（破壊的）
 * @param context 
 * @param state 
 * @param idx 
 */
function refreshEXPStateOne(context: Context, state: UserState, idx: number) {
  const d = state.formation[idx]
  const after = refreshExpLevelOne(context, d)
  if (after) {
    if (after.level > d.level) {
      const before = copyState(d)
      // UserStateのサブクラスも考慮
      copyStateTo(after, d)
      // 新規にスキル獲得した場合はスキル状態を初期化
      refreshSkillStateOne(context, state, idx)
      let event: LevelupEvent = {
        type: "levelup",
        data: {
          time: context.currentTime,
          after: copyState(d),
          before: before,
        }
      }
      state.event.push(event)
      context.log.log(`レベルアップ：${after.name} Lv.${before.level}->Lv.${after.level}`)
      context.log.log(`現在の経験値：${after.name} ${after.currentExp}/${after.nextExp}`)
    } else {
      copyStateTo(after, d)
    }
  }
}

function refreshExpLevelOne(context: Context, denco: ReadonlyState<DencoState>): DencoState | undefined {
  assert(denco.currentExp >= 0, `現在の経験値が負数です ${denco.name}`)
  if (denco.currentExp < denco.nextExp) return undefined
  let d = copyState<DencoState>(denco)
  let level = d.level
  while (d.currentExp >= d.nextExp) {
    let status = DencoManager.getDencoStatus(d.numbering, level + 1)
    if (status) {
      level += 1
      d = {
        ...status,
        currentHp: status.maxHp, // 現在のHPを無視して最大HPに設定
        currentExp: status.maxLevel ? status.nextExp : d.currentExp - d.nextExp, // 最大レベル時はnextExpで固定する
        film: d.film,
        link: d.link,
        skill: d.skill,
      }
      const nextSkill = SkillManager.getSkill(d.numbering, level)
      if (d.skill.type === "possess"
        && nextSkill.type === "possess"
        && d.skill.level !== nextSkill.level) {
        const currentSkill = d.skill
        assert(currentSkill.transitionType === nextSkill.transitionType)
        // 現在のスキル状態 transition.* はそのまま
        // 有効時間などは前スキルで決定されたデータのまま
        nextSkill.transition = currentSkill.transition
        // custom-propertyは変更しない
        nextSkill.data = currentSkill.data
        d.skill = nextSkill
      }
      if (status.maxLevel) break
    } else {
      // 既に最大レベル
      d.currentExp = d.nextExp // 最大レベル時はnextExpで固定する
      break
    }
  }
  return d
}