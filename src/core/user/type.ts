import { DencoState } from "../denco";
import { Event, SkillEventReservation } from "../event";
import { Station } from "../station";

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

  /**
   * やちよ(D27 Yachiyo)のスキル対象の駅か判定する述語を指定できます
   * 
   * スキルの本来の定義では「直近3ヶ月でアクセスが一番多い駅と、その周辺駅の合計5駅」
   * となっていますが、ここでは自由に判定方法を指定できます
   */
  isHomeStation?: (station: Station) => boolean
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
