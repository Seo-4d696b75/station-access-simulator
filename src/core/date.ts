import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { isHoliday } from './holiday';

export const TIME_FORMAT = "HH:mm:ss.SSS"
export const DATE_TIME_FORMAT = "YYYY-MM-DD'T'HH:mm:ss.SSS"

dayjs.extend(utc)
dayjs.extend(timezone)

// 毎回extendするの面倒なのでここからexportして使う
// export default dayjs

/**
 * 今日が週末または祝日か判定する
 * 
 * - デフォルトで"Asia/Tokyo"のタイムゾーンで曜日を判定する
 * - 日本の祝日は @holiday-jp/holiday_jp で判定
 * 
 * @param time 現在時刻 [ms]
 * @return 土日または日本の祝日の場合は`true`
 */
export function isWeekendOrHoliday(time: number): boolean {
  const weekday = dayjs.tz(time).day()
  if (weekday === 0 || weekday === 6) return true
  return isHoliday(time)
}

/**
 * 時間を文字列にフォーマットする
 * 
 * 最小で秒単位で時間を文字列表現に変換する
 * @param duration 時間[ms]
 * @returns 負数の場合は空文字
 */
export function formatDuration(duration: number): string {
  if (duration < 0) return ""
  duration = Math.floor(duration / 1000)
  let str = `${duration % 60}秒`
  duration = Math.floor(duration / 60)
  if (duration === 0) return str
  str = `${duration % 60}分` + str
  duration = Math.floor(duration / 60)
  if (duration === 0) return str
  str = `${duration % 24}時間` + str
  duration = Math.floor(duration / 24)
  if (duration === 0) return str
  str = `${duration}日` + str
  return str
}
