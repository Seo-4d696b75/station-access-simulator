import { Context } from "./context"
import { Denco, DencoAttribute, DencoType } from "./denco"
import skillManager from "./skillManager"
import { StationLink } from "./station"
import stationManager from "./stationManager"

interface DencoLevelStatus {
  numbering: string
  name: string
  fullName: string
  type: DencoType
  attr: DencoAttribute

  level: number
  ap: number
  maxHp: number
  nextExp: number
}

class DencoManager {

  data: Map<string, DencoLevelStatus[]> = new Map()

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
        let status: DencoLevelStatus = {
          level: i + 1,
          ap: ap[i],
          maxHp: hp[i],
          nextExp: exp[i],
          numbering: e.numbering,
          name: e.name,
          fullName: e.full_name,
          type: e.type,
          attr: e.attribute,
        }
        return status
      })
      this.data.set(e.numbering, status)
    }
  }

  getDenco(context: Context, numbering: string, level: number = 50, link: StationLink[] | number = []): Denco {
    const status = this.getDencoStatus(numbering, level)
    if (!status) {
      context.log.error(`指定したレベルの情報がありません ${numbering} Lv.${level}`)
      throw Error("invalid level, status data not found")
    }
    const skill = skillManager.getSkill(numbering, level)
    const linkList = (typeof link === "number") ?
      stationManager.getRandomLink(context, link) : link
    return {
      ...status,
      currentExp: 0,
      currentHp: status.maxHp,
      skill: skill,
      film: {

      },
      link: linkList,
    }
  }

  getDencoStatus(numbering: string, level: number): DencoLevelStatus | undefined {
    const data = this.data.get(numbering)
    if (!data) throw Error(`denco data not found: ${numbering}`)
    if (level < 1 || level > data.length) {
      return undefined
    }
    return data[level - 1]
  }

  checkLevelup(formation: Denco[]): Denco[] {
    return formation.map(d => {
      let level = d.level
      while (d.currentExp >= d.nextExp) {
        let status = this.getDencoStatus(d.numbering, level + 1)
        if (status) {
          level += 1
          d = {
            ...status,
            currentHp: status.maxHp, // 現在のHPを無視して最大HPに設定
            currentExp: d.currentExp - d.nextExp,
            film: d.film,
            link: d.link,
            skill: skillManager.getSkill(d.numbering, level)
          }
        } else {
          // これ以上のレベルアップはなし
          d = {
            ...d,
            currentExp: d.nextExp
          }
          break
        }
      }
      return d
    })
  }

}

const manager = new DencoManager()
export default manager