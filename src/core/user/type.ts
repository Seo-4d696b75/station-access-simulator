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
   * ユーザがアクセスした駅の情報
   * 
   * 各プロパティはPartialです.
   * `undefined`の場合の挙動は各プロパティの説明を参照してください
   */
  statistics?: Partial<StationStatistics>
}

/**
 * アクセスした駅の情報
 */
export interface StationStatistics {
  /**
   * やちよ(D27 Yachiyo)のスキル対象の駅か判定する述語を指定できます
   * 
   * スキルの本来の定義では「直近3ヶ月でアクセスが一番多い駅と、その周辺駅の合計5駅」
   * となっていますが、ここでは自由に判定方法を指定できます
   * 
   * **未定義の挙動** この関数が`undefined`の場合はすべての駅を「地元駅」として扱います
   * 
   * @param station
   * @return 地元駅の場合は`true`
   */
  isHomeStation: (station: Station) => boolean

  /**
   * 指定した駅へのアクセス回数（累積）を取得する関数
   * 
   * **未定義の挙動** この関数が`undefined`の場合はアクセス回数を0として扱います
   * @param station
   * @return これまでに駅にアクセスした回数（０以上の整数）
   */
  getStationAccessTimes: (station: Station) => number
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
