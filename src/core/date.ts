import { isHoliday } from '@holiday-jp/holiday_jp';
import moment from 'moment-timezone';

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
  const weekday = moment(time).day()
  if (weekday === 0 || weekday === 6) return true
  return isHoliday(new Date(time))
}