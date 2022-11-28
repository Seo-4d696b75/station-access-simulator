import { SimulatorError } from "./context"

let loaded: ((d: Date) => boolean) | null = null

export async function load() {
  const module = await import(
    /* webpackMode: "lazy" */
    /* webpackChunkName: "holiday" */
    "@holiday-jp/holiday_jp"
  )
  loaded = module.isHoliday
}

/*
 * @holiday-jp/holiday_jp は祝日をデータファイルに直書きしている
 * そのままバンドルするとサイズデカすぎるので分離する
 * 
 */
export function isHoliday(time: number): boolean {
  const fun = loaded
  if (!fun) throw new SimulatorError("holiday module not loaded yet")
  return fun(new Date(time))
}