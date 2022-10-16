import { Context } from "../context"
import { ReadonlyState } from "../state"
import { Station } from "../station"

/**
 * ユーザの状態のうちライブラリ側で操作しない情報
 * 
 * このオブジェクトのプロパティはライブラリ側からは参照のみ
 */
export interface UserProperty {
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
   * **有効な値** 0以上の実数  
   * **デフォルト値** このプロパティが`undefined`の場合は0kmとして扱います
   */
  distance: number
  /**
   * その日にアクセスした駅数  
   * 
   * アクセス時に発動するスキルに影響する場合、この値は
   * アクセス時点での駅数として扱うためアクセスによる駅数の増加は予め反映させておく必要があります
   * 
   * **有効な値** 0以上の整数
   * **デフォルト値** このプロパティが`undefined`の場合は0として扱います
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
  isHomeStation: (station: ReadonlyState<Station>) => boolean

  /**
   * 指定した駅へのアクセス回数（累積）を取得する関数
   * 
   * **未定義の挙動** この関数が`undefined`の場合はアクセス回数を0として扱います
   * @param station
   * @return これまでに駅にアクセスした回数（０以上の整数）
   */
  getStationAccessCount: (station: ReadonlyState<Station>) => number
}

/**
 * ユーザの状態・アクセス駅情報を読み出す方法を定義します
 */
export interface UserPropertyReader {
  readonly name: string
  /**
   * ユーザがその日にアクセスした駅の情報を読み出す関数を定義します
   * 
     * {@link DailyStatistics}の各プロパティのバリデーション・デフォルト値を考慮して読み出します
     * 
     * 各デフォルト値を考慮した返り値の決定方法は、
     * 1. {@link DailyStatistics}に定義されている場合はその値
     * 2. 関数の引数`defaultValue`が渡された場合はその値
     * 3. 各プロパティ定義のデフォルト値
     * 
     * 最後にバリデーションを行い有効な値のみ返します
     * 
     * @param context
     * @param defaultValue 呼び出し側からデフォルト値を指定できます
     * @throws バリエーションを通らない不正な値の場合
   */
  readonly daily: {
    readonly [key in keyof DailyStatistics as `read${Capitalize<key>}`]: (context: Context, defaultValue?: DailyStatistics[key]) => DailyStatistics[key]
  }

  /**
   * ユーザがこれまでアクセスした駅の情報を読み出す関数を定義します
     * {@link StationStatistics}の各関数の返り値のバリデーション・デフォルト値を考慮して読み出します
     * 
     * 各デフォルト値を考慮した返り値の決定方法は、
     * 1. {@link StationStatistics}に定義されている場合はその関数を呼び出します
     * 3. 各関数定義のデフォルトの返り値
     * 
     * 最後にバリデーションを行い有効な値のみ返します
     * 
     * @param context
     * @param args 各関数の引数
     * @throws バリエーションを通らない不正な値の場合
   */
  readonly history: {
    readonly [key in keyof StationStatistics]: (context: Context, ...args: Parameters<StationStatistics[key]>) => ReturnType<StationStatistics[key]>
  }
}

export function getUserPropertyReader(property: ReadonlyState<UserProperty>): UserPropertyReader {
  return {
    name: property.name,
    daily: {
      readDistance: initPropertyReader(
        "daily.distance",
        property.daily?.distance,
        0,
        (value) => value >= 0,
      ),
      readAccessStationCount: initPropertyReader(
        "daily.accessStationCount",
        property.daily?.accessStationCount,
        0,
        (value) => Number.isInteger(value) && value >= 0,
      ),
    },
    history: {
      isHomeStation: initFuncProxy<boolean, (s: ReadonlyState<Station>) => boolean>(
        "history.isHomeStation",
        property.history?.isHomeStation,
        true,
      ),
      getStationAccessCount: initFuncProxy(
        "history.getStationAccessCount",
        property.history?.getStationAccessCount,
        0 as number,
      ),
    }
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

function initFuncProxy<T extends NonNullable<any>, F extends (...args: any[]) => T>(funcName: string, func: F | undefined, funcDefaultReturnValue: T, validator?: (v: T) => boolean) {
  return (context: Context, ...args: Parameters<F>): T => {
    let value = func?.(args)
    if (value === undefined) {
      value = funcDefaultReturnValue
      context.log.log(`${funcName}() 関数定義のデフォルト値を返しました : ${funcDefaultReturnValue}`)
    }
    if (value === undefined) {
      context.log.error(`関数${funcName}()を呼び出せません（関数が未定義・デフォルト値の指定なし）`)
    }
    if (validator?.(value) === false) {
      context.log.error(`関数${funcName}() の返り値が不正です！ : ${value}`)
    }
    return value
  }
}