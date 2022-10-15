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
   * ユーザがその日にアクセスした駅の情報
   * 
   * 各プロパティはPartialです.
   * `undefined`の場合の挙動は各プロパティの説明を参照してください
   */
  daily?: Partial<DailyStatistics>

  /**
   * ユーザがこれまでアクセスした駅の情報
   * 
   * 各プロパティはPartialです.
   * `undefined`の場合の挙動は各プロパティの説明を参照してください
   */
  history?: Partial<StationStatistics>
}

export interface DailyStatistics {
  /**
   * その日に移動した距離（単位：km） 
   * 
   * アクセス時に発動するスキルに影響する場合、この値は
   * アクセス時点での移動距離として扱うためアクセスによる移動距離の増加は予め反映させておく必要があります
   * 
   * **未定義の挙動** このプロパティが`undefined`の場合は0kmとして扱います
   */
  distance: number
  /**
   * その日にアクセスした駅数  
   * 
   * アクセス時に発動するスキルに影響する場合、この値は
   * アクセス時点での駅数として扱うためアクセスによる駅数の増加は予め反映させておく必要があります
   * 
   * **未定義の挙動** このプロパティが`undefined`の場合は0として扱います
   */
  accessStationCount: number
}

/**
 * ユーザがこれまでアクセスした駅の情報
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
  getStationAccessCount: (station: Station) => number
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
