import { Context } from "./context";
import { Random } from "./random";
import { Station, StationAttribute, StationLink } from "./station";

class StationManager {
  data: Station[] = []

  async load(data?: string) {
    const list = data ? JSON.parse(data) :
      await import("../data/station.json").then(r => r.default).catch(e => [])
    if (!Array.isArray(list)) {
      throw Error("station data root not array")
    }
    for (let e of list) {
      let s: Station = {
        name: e.name as string,
        nameKana: e.name_kana as string,
        attr: e.attr as StationAttribute,
      }
      this.data.push(s)
    }
  }

  clear() {
    this.data.splice(0)
  }

  getRandomStation(context: Context, size: number): Station[] {
    if (size === 0) return []
    if (size > this.data.length) {
      context.log.error("データサイズを越えています")
      throw RangeError("random station size > data size")
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