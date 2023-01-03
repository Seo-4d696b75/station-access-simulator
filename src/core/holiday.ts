import dayjs from "dayjs"
import { SimulatorError } from "./context"

/**
 * "yyyy-MM-dd"形式の文字列表現をkeyにもつ祝日の辞書
 * 
 * [see definition](https://github.com/holiday-jp/holiday_jp-js/blob/master/lib/holidays.js)
 */
let loaded: Record<string, any> | null = null

export async function load() {
  const module = await import(
    /* webpackMode: "lazy" */
    /* webpackChunkName: "holiday" */
    "@holiday-jp/holiday_jp"
  )
  loaded = module.holidays
}

/*
 * @holiday-jp/holiday_jp は祝日をデータファイルに直書きしている
 * そのままバンドルするとサイズデカすぎるので分離する
 * 
 * ## 実行環境の違いによる影響
 * 
 * オリジナルのisHolidayの実装
 * https://github.com/holiday-jp/holiday_jp-js/blob/master/lib/holiday_jp.js#L23-L30
 * 
 * 問題は`Date`を文字列表現に変換するとき使用する`Date#getDate/Month/Year`が
 * ローカル時刻の影響を受ける
 * https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Date/getDate
 * 
 * タイムゾーンを考慮して変換しないと日付が前後する場合がある
 */
export function isHoliday(time: number): boolean {
  const record = loaded
  if (!record) throw new SimulatorError("holiday module not loaded yet")
  // 日本時間で文字列表現にformat
  const date = dayjs.tz(time)
  const str = date.format("YYYY-MM-DD")
  return !!record[str]
}