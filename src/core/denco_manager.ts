import { Denco, DencoAttribute, DencoType } from "./denco"
import skill_manager from "./skill_manager"

interface DencoLevelStatus {
  level: number
  ap: number
  max_hp: number
  next_exp: number
}

interface DencoData {
  numbering: string
  name: string
  full_name: string
  type: DencoType
  attr: DencoAttribute
  status_list: DencoLevelStatus[]
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
          max_hp: hp[i],
          next_exp: exp[i],
        } as DencoLevelStatus
      })
      const d: DencoData = {
        numbering: e.numbering,
        name: e.name,
        full_name: e.full_name,
        type: e.type,
        attr: e.attribute,
        status_list: status
      }
      this.data.set(d.numbering, d)
    }
  }

  getDenco(numbering: string, level: number = 50): Denco {
    const data = this.data.get(numbering)
    if (!data) throw Error(`denco data not found: ${numbering}`)
    if (level < 1 || level > data.status_list.length) {
      throw Error(`invalid level:${level} for data size ${data.status_list.length}`)
    }
    const status = data.status_list[level - 1]
    const skill = skill_manager.getSkill(numbering, level)
    return {
      numbering: data.numbering,
      name: data.name,
      type: data.type,
      attr: data.attr,
      ...status,
      level: level,
      current_exp: 0,
      current_hp: status.max_hp,
      skill: skill,
      film: {

      }
    }
  }

}

const manager = new DencoManager()
export default manager