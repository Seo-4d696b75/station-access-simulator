import { assert, Context } from "../context"
import { ReadonlyState } from "../state"
import { Station } from "../station"

/**
 * ユーザの状態のうちライブラリ側で操作しない情報
 * 
 * このオブジェクトのプロパティはライブラリ側からは参照のみ
 */
export type UserProperty = UserProfile & Partial<UserAccessStatistics>

export interface UserProfile {
  /**
   * ユーザ名
   */
  name: string
}

export interface UserAccessStatistics {
  /**
   * その日に移動した距離（単位：km） 
   * 
   * アクセス時に発動するスキルに影響する場合、この値は
   * アクセス時点での移動距離として扱うためアクセスによる移動距離の増加は予め反映させておく必要があります
   * 
   * **有効な値** 0以上の実数  
   * **デフォルト値** このプロパティが`undefined`の場合は0kmとして扱います
   */
  getDailyDistance(date: LocalDateType): number

  /**
   * その日にアクセスした駅数  
   * 
   * アクセス時に発動するスキルに影響する場合、この値は
   * アクセス時点での駅数として扱うためアクセスによる駅数の増加は予め反映させておく必要があります
   * 
   * **有効な値** 0以上の整数
   * **デフォルト値** このプロパティが`undefined`の場合は0として扱います
   */
  getDailyAccessCount(date: LocalDateType): number

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
  isHomeStation: (station: ReadonlyState<Station>) => boolean

  /**
   * 指定した駅へのアクセス回数（累積）を取得する関数
   * 
   * **未定義の挙動** この関数が`undefined`の場合はアクセス回数を0として扱います
   * @param station
   * @return これまでに駅にアクセスした回数（０以上の整数）
   */
  getAccessCount: (station: ReadonlyState<Station>) => number

  /**
   * 指定した駅が新駅か判定する
   * 
   * **未定義の挙動** この関数が`undefined`の場合はすべての駅を新駅として扱いません  
   * {@link NewStationType None}を返します
   * @param station 
   * @returns 新駅のタイプ
   */
  isNewStation: (station: ReadonlyState<Station>) => NewStationType
}

/**
 * - `None` : いずれの新駅でもない
 * - `Daily` : 今日の新駅
 * - `Monthly` : 今月の新駅（黄色新駅）
 * - `New` : 赤新駅 
 */
export enum NewStationType {
  None = 0,
  Daily = 1,
  Monthly = 2,
  New = 4,
}

// TODO 現状ではスキルに関連する情報は今日と昨日だけで十分
export enum LocalDateType {
  Today = "today",
  Yesterday = "yesterday",
}

/**
 * ユーザの状態・アクセス駅情報を読み出す方法を定義します
 * 
 * ### アクセス情報の読み出し
 * ユーザがアクセスした駅の情報を読み出す関数を定義します
 * 
 * 1. {@link UserProperty}に関数が定義されている場合はその関数を呼び出します
 * 2. 関数が未定義の場合はデフォルトの返り値
 * 
 * 最後にバリデーションを行い有効な値のみ返します
 */
export type UserPropertyReader = UserProfile & UserAccessStatistics

export function getUserPropertyReader(property: ReadonlyState<UserProperty>): UserPropertyReader {
  return {
    name: property.name,
    getDailyDistance: initFuncProxy(
      "getDailyDistance",
      property.getDailyDistance,
      0,
      (value) => value >= 0,
    ),
    getDailyAccessCount: initFuncProxy(
      "getDailyAccessCount",
      property.getDailyAccessCount,
      0,
      (value) => Number.isInteger(value) && value >= 0,
    ),
    isHomeStation: initFuncProxy<boolean, (s: ReadonlyState<Station>) => boolean>(
      "isHomeStation",
      property.isHomeStation,
      true,
    ),
    getAccessCount: initFuncProxy(
      "getAccessCount",
      property.getAccessCount,
      0,
      (value) => Number.isInteger(value) && value >= 0,
    ),
    isNewStation: initFuncProxy(
      "isNewStation",
      property.isNewStation,
      NewStationType.None as NewStationType,
    )
  }
}

function initPropertyReader<T extends NonNullable<any>>(propertyName: string, propertyValue: T | undefined, propertyDefaultValue: T, validator?: (v: T) => boolean) {
  return (context: Context, defaultValue?: T): T => {
    let value = propertyValue
    if (value === undefined) {
      value = defaultValue
    }
    if (value === undefined) {
      value = propertyDefaultValue
      context.log.log(`${propertyName} プロパティ定義のデフォルト値を読み出しました : ${propertyDefaultValue}`)
    }
    if (value === undefined) {
      context.log.error(`${propertyName}を読み出せません（値が未定義・デフォルト値の指定なし）`)
    }
    if (validator?.(value) === false) {
      context.log.error(`${propertyName}の値が不正です！ : ${value}`)
    }
    return value
  }
}

function initFuncProxy<T extends NonNullable<any>, F extends (...args: any[]) => T>(
  funcName: string,
  func: F | undefined,
  funcDefaultReturnValue: T,
  validator?: (v: T) => boolean
) {
  return (...args: Parameters<F>): T => {
    let value = func?.(...args)
    if (value === undefined) {
      value = funcDefaultReturnValue
      // context.log.log(`${funcName}() 関数定義のデフォルト値を返しました : ${funcDefaultReturnValue}`)
    }
    assert(
      value !== undefined,
      `関数${funcName}()を呼び出せません（関数が未定義・デフォルト値の指定なし）`
    )
    assert(
      validator?.(value) !== false,
      `関数${funcName}() の返り値が不正です！ : ${value}`,
    )
    return value
  }
}