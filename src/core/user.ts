import { copyDencoState, DencoState } from "./denco";
import { Event, LevelupEvent } from "./event";
import { refreshSkillState, refreshSkillStateOne } from "./skill";
import DencoManager from "./dencoManager"
import { Context, getCurrentTime } from "./context";
import { refreshEventQueue, SkillEventReservation } from "./skillEvent";
import moment from "moment-timezone"
import { copyDencoStateTo, Denco, fixClock, SkillManager } from "..";

type Primitive = number | string | boolean | bigint | symbol | undefined | null;
type Builtin = Primitive | Function | Date | Error | RegExp;
/**
 * 変更不可な状態を表す型
 */
export type ReadonlyState<T> = T extends (Builtin | Event)
  ? T
  : { readonly [key in keyof T]: ReadonlyState<T[key]> }

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
  const date = moment(getCurrentTime(context))
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
    ...copyUserState(current),
    event: Array.from(current.event),
    formation: formation.map(d => copyDencoState(d)),
  }
  let before = current.formation.map(d => d.name).join(",")
  let after = formation.map(d => d.name).join(",")
  context.log.log(`編成を変更します [${before}] -> [${after}]`)
  _refreshState(context, state)
  return state
}

export function copyUserStateTo(src: ReadonlyState<UserState>, dst: UserState) {
  dst.user = copyUserParam(src.user)
  dst.formation.forEach((d, idx) => copyDencoStateTo(src.formation[idx], d))
  dst.event = Array.from(src.event)
  dst.queue = Array.from(src.queue)
}

export function copyUserState(state: ReadonlyState<UserState>): UserState {
  return {
    user: copyUserParam(state.user),
    formation: state.formation.map(d => copyDencoState(d)),
    event: Array.from(state.event),
    queue: Array.from(state.queue),
  }
}

export function copyUserParam(param: ReadonlyState<UserParam>): UserParam {
  return {
    name: param.name,
    dailyDistance: param.dailyDistance
  }
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
  context = fixClock(context)
  let next = copyUserState(state)
  refreshSkillState(context, next)
  refreshEventQueue(context, next)
  refreshEXPState(context, next)
  return next
}

/**
 * {@link refreshState} の破壊的バージョン
 */
export function _refreshState(context: Context, state: UserState) {
  context = fixClock(context)
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

function refreshEXPStateOne(context: Context, state: UserState, idx: number) {
  const d = state.formation[idx]
  const levelup = checkLevelup(context, d)
  if (levelup) {
    const before = copyDencoState(d)
    // copy
    copyDencoStateTo(levelup, d)
    // 新規にスキル獲得した場合はスキル状態を初期化
    refreshSkillStateOne(context, state, idx)
    let event: LevelupEvent = {
      type: "levelup",
      data: {
        time: getCurrentTime(context),
        after: copyDencoState(d),
        before: before,
      }
    }
    state.event.push(event)
    context.log.log(`レベルアップ：${levelup.name} Lv.${d.level}->Lv.${levelup.level}`)
    context.log.log(`現在の経験値：${levelup.name} ${levelup.currentExp}/${levelup.nextExp}`)
  }
}

function checkLevelup(context: Context, denco: ReadonlyState<DencoState>): DencoState | undefined {
  if (denco.currentExp < denco.nextExp) return undefined
  let d = copyDencoState(denco)
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