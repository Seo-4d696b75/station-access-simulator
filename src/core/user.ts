import moment from "moment-timezone";
import { SkillManager } from "..";
import { Context } from "./context";
import { DencoState } from "./denco";
import DencoManager from "./dencoManager";
import { refreshEventQueue, SkillEventReservation } from "./event";
import { Event, LevelupEvent } from "./event/type";
import { refreshSkillState, refreshSkillStateOne } from "./skill";
import { copyState, copyStateTo, ReadonlyState } from "./state";

interface EventQueueEntryBase<T, E = undefined> {
  readonly type: T
  readonly time: number
  readonly data: E
}

export type EventQueueEntry =
  EventQueueEntryBase<"skill", SkillEventReservation> |
  EventQueueEntryBase<"hour_cycle">

/**
 * ユーザの状態のうちライブラリ側で操作しない情報
 * 
 * このオブジェクトのプロパティはライブラリ側からは参照のみ
 */
export interface UserParam {
  name: string
  /**
   * アクセス時の移動距離 単位：km
   */
  dailyDistance: number
}

/**
 * ユーザの状態を表現する
 * 
 * 原則としてこの状態変数が操作の起点になる
 */
export interface UserState {
  /**
   * ユーザの詳細情報
   */
  user: UserParam
  /**
   * 現在の編成状態
   */
  formation: DencoState[]

  /**
   * タイムライン上に表示されるイベント一覧
   */
  event: Event[]

  /**
   * 指定時刻に処理するイベントの待機列 FIFO
   */
  queue: EventQueueEntry[]
}

export interface FormationPosition {

  /**
   * 主体となるでんこの編成内のindex  
   * 0 <= carIndex < formation.length
   */
  carIndex: number
}

export function getTargetDenco<T>(state: { formation: readonly T[], carIndex: number }): T {
  return state.formation[state.carIndex]
}

export function initUser(context: Context, userName: string, formation?: ReadonlyState<DencoState[]>, param?: Partial<UserParam>): UserState {
  if (!formation) formation = []
  const date = moment(context.currentTime)
    .millisecond(0)
    .second(0)
    .minute(0)
    .add(1, "h")
  return changeFormation(context, {
    user: {
      name: param?.name ?? userName,
      dailyDistance: param?.dailyDistance ?? 0,
    },
    formation: [],
    event: [],
    queue: [{
      type: "hour_cycle",
      time: date.valueOf(),
      data: undefined,
    }],
  }, formation)
}

export function changeFormation(context: Context, current: ReadonlyState<UserState>, formation: ReadonlyState<DencoState[]>): UserState {
  const state: UserState = {
    ...copyState<UserState>(current),
    event: Array.from(current.event),
    formation: formation.map(d => copyState<DencoState>(d)),
  }
  let before = current.formation.map(d => d.name).join(",")
  let after = formation.map(d => d.name).join(",")
  context.log.log(`編成を変更します [${before}] -> [${after}]`)
  refreshUserState(context, state)
  return state
}

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
export function refreshUserState(context: Context, state: UserState) {
  context = context.fixClock()
  refreshSkillState(context, state)
  refreshEventQueue(context, state)
  refreshEXPState(context, state)
}

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
  const levelup = checkLevelup(context, d)
  if (levelup) {
    const before = copyState(d)
    // copy
    copyStateTo(levelup, d)
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
    context.log.log(`レベルアップ：${levelup.name} Lv.${before.level}->Lv.${levelup.level}`)
    context.log.log(`現在の経験値：${levelup.name} ${levelup.currentExp}/${levelup.nextExp}`)
  }
}

function checkLevelup(context: Context, denco: ReadonlyState<DencoState>): DencoState | undefined {
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
        currentExp: d.currentExp - d.nextExp,
        film: d.film,
        link: d.link,
        skill: SkillManager.getSkill(d.numbering, level)
      }
    } else {
      // これ以上のレベルアップはなし
      d = {
        ...d,
        currentExp: d.nextExp
      }
      break
    }
  }
  return d
}