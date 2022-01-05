import { Context } from "./context"
import { Denco, DencoAttribute, DencoType } from "./denco"
import skillManager from "./skillManager"
import { StationLink } from "./station"
import stationManager from "./stationManager"

interface DencoLevelStatus {
  level: number
  ap: number
  maxHp: number
  nextExp: number
}

interface DencoData {
  numbering: string
  name: string
  fullName: string
  type: DencoType
  attr: DencoAttribute
  statusList: DencoLevelStatus[]
}

class DencoManager {

  data: Map<string, DencoData> = new Map()

  async load(data?: string) {
    const list = data ? JSON.parse(data) : await import("../data/base.json").then(o => o.default).catch(e => [])
    if (!Array.isArray(list)) throw Error("fail to load denco base data")
    for (let e of list) {
      if (!e.numbering || !e.type || !e.name || !e.full_name || !e.attribute) {
        throw Error(`invalid denco data lacking properties ${JSON.stringify(e)}`)
      }
      if (!e.AP || !e.HP || !e.EXP) {
        throw Error(`invalid denco status data ${JSON.stringify(e)}`)
      }
      const ap = e.AP as number[]
      const hp = e.HP as number[]
      const exp = e.EXP as number[]
      const size = ap.length
      if (hp.length !== size || exp.length !== size) {
        throw Error(`invalid denco status: AP, HP, EXP size mismatch ${JSON.stringify(e)}`)
      }
      const status = Array(size).fill(0).map((_, i) => {
        return {
          level: i + 1,
          ap: ap[i],
          maxHp: hp[i],
          nextExp: exp[i],
        } as DencoLevelStatus
      })
      const d: DencoData = {
        numbering: e.numbering,
        name: e.name,
        fullName: e.full_name,
        type: e.type,
        attr: e.attribute,
        statusList: status
      }
      this.data.set(d.numbering, d)
    }
  }

  getDenco(context: Context, numbering: string, level: number = 50, link: StationLink[] | number = []): Denco {
    const data = this.data.get(numbering)
    if (!data) throw Error(`denco data not found: ${numbering}`)
    if (level < 1 || level > data.statusList.length) {
      throw Error(`invalid level:${level} for data size ${data.statusList.length}`)
    }
    const status = data.statusList[level - 1]
    const skill = skillManager.getSkill(numbering, level)
    const linkList = (typeof link === "number") ?
      stationManager.getRandomLink(context, link) : link
    return {
      numbering: data.numbering,
      name: data.name,
      type: data.type,
      attr: data.attr,
      ...status,
      level: level,
      currentExp: 0,
      currentHp: status.maxHp,
      skill: skill,
      film: {

      },
      link: linkList,
    }
  }

}

const manager = new DencoManager()
export default manager