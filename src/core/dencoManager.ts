import { Context } from "./context"
import { copyDencoState, Denco, DencoAttribute, DencoState, DencoType } from "./denco"
import { refreshSkillState } from "./skill"
import skillManager from "./skillManager"
import { StationLink } from "./station"
import stationManager from "./stationManager"
import { copyUserState, ReadonlyState, UserState } from "./user"

interface DencoLevelStatus extends Denco {

  readonly level: number
  readonly ap: number
  readonly maxHp: number
  readonly nextExp: number
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
      let exp = e.EXP as number[]
      const size = ap.length
      if (hp.length !== size || exp.length !== size) {
        throw Error(`invalid denco status: AP, HP, EXP size mismatch ${JSON.stringify(e)}`)
      }
      // EXP: level(idx)->level(idx+1)にレベルアップ必要な経験値
      if (exp[0] !== 0) {
        throw Error("EXP array[0] must be 0")
      }
      exp = [...exp.slice(1), exp[size - 1]]
      const status = Array(size).fill(0).map((_, i) => {
        let status: DencoLevelStatus = {
          level: i + 1,
          ap: ap[i],
          maxHp: hp[i],
          nextExp: exp[i],
          numbering: e.numbering,
          name: e.name,
          //fullName: e.full_name,
          type: e.type,
          attr: e.attribute,
        }
        return status
      })
      this.data.set(e.numbering, status)
    }
  }

  getDenco(context: Context, numbering: string, level: number = 50, link: StationLink[] | number = []): DencoState {
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

}

const manager = new DencoManager()
export default manager