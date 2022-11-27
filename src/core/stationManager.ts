import { Context, SimulatorError } from "./context";
import { Random } from "./random";
import { Line, Station, StationAttribute, StationLink } from "./station";

class StationManager {
  data: Station[] = []

  async load(stationData?: string, lineData?: string) {
    const lines = lineData ? JSON.parse(lineData) :
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "line" */
        "../data/line.json"
      ).then(r => r.default).catch(e => [])
    if (!Array.isArray(lines)) {
      throw new SimulatorError("line data root not array")
    }
    const lineMap = new Map<number, Line>()
    lines.forEach(e => {
      let line: Line = {
        name: e.name as string
      }
      let code = e.code as number
      lineMap.set(code, line)
    })
    const stations = stationData ? JSON.parse(stationData) :
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "station" */
        "../data/station.json"
      ).then(r => r.default).catch(e => [])
    if (!Array.isArray(stations)) {
      throw new SimulatorError("station data root not array")
    }
    stations.forEach(e => {
      let lines = (e.lines as number[]).map(code => {
        const line = lineMap.get(code)
        if (!line) throw new SimulatorError(`路線（code=${code}）が見つかりません`)
        return line
      })
      let s: Station = {
        name: e.name as string,
        nameKana: e.name_kana as string,
        attr: e.attr as StationAttribute,
        lines: lines,
      }
      this.data.push(s)
    })
  }

  clear() {
    this.data.splice(0)
  }

  getRandomStation(context: Context, size: number): Station[] {
    if (size === 0) return []
    if (size > this.data.length) {
      context.log.error("データサイズを越えています")
    }
    const list = shuffle(this.data, context.random, size)
    context.log.log(`ランダムに駅を選出：${list.map(s => s.name).join(",")}`)
    return list
  }

  getRandomLink(context: Context, size: number, minLinkSec: number = 10, maxLinkSec: number = 3600): StationLink[] {
    if (size === 0) return []
    minLinkSec = Math.max(minLinkSec, 1)
    maxLinkSec = Math.max(maxLinkSec, minLinkSec)
    const station = this.getRandomStation(context, size)
    const duration = new Array(size).fill(null)
      .map(() => minLinkSec * 1000 + Math.floor((maxLinkSec - minLinkSec) * 1000 * context.random()))
      .sort().reverse()
    const now = context.currentTime
    return station.map((s, idx) => {
      let link: StationLink = {
        ...s,
        start: now - duration[idx]
      }
      return link
    })
  }
}

function shuffle<E>(src: E[], random: Random, size: number): E[] {
  const dst = Array.from(src)
  for (let i = 0; i < dst.length - 1 && i < size; i++) {
    let j = Math.floor(random() * (dst.length - i)) + i
    let tmp = dst[i]
    dst[i] = dst[j]
    dst[j] = tmp
  }
  return dst.slice(0, size)
}

const manager = new StationManager()
export default manager