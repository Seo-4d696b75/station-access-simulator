import { assert, Context, SimulatorError } from "./context"
import { Denco, DencoState } from "./denco"
import skillManager from "./skill"
import { StationLink } from "./station"
import stationManager from "./stationManager"

interface DencoLevelStatus extends Denco {
  readonly level: number
  readonly maxLevel: boolean
  readonly ap: number
  readonly maxHp: number
  readonly nextExp: number
}

const nextExp = [400, 800, 1200, 1600, 2100, 2600, 3200, 3700, 4300, 4900, 5500, 6100, 6800, 7500, 8100, 8800, 9500, 10200, 10900, 11700, 12400, 13200, 13900, 14700, 15500, 16300, 17100, 17900, 18700, 19600, 20400, 21200, 22100, 23000, 23800, 24700, 25600, 26500, 27300, 28300, 29200, 30100, 31000, 32000, 32900, 33800, 34800, 35800, 36700, 37600, 38700, 39600, 40600, 41600, 42600, 43600, 44600, 45600, 46600, 47600, 48700, 49700, 50800, 51700, 52900, 53800, 55000, 56000, 57000, 58100, 59200, 60300, 61400, 62400, 63600, 64600, 65800, 66800, 68000, 68000] as const

class DencoManager {

  data: Map<string, DencoLevelStatus[]> = new Map()

  async load(data?: string) {
    const list = data ? JSON.parse(data) : await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "denco" */
      "../data/base.json"
    ).then(o => o.default).catch(e => [])
    if (!Array.isArray(list)) throw new SimulatorError("fail to load denco base data")
    for (let e of list) {
      assert(
        e.numbering && e.type && e.name && e.full_name && e.first_name && e.attr,
        `invalid denco data lacking properties ${JSON.stringify(e)}`
      )
      assert(
        e.AP && e.HP,
        `invalid denco status data ${JSON.stringify(e)}`
      )
      const apList = e.AP as number[]
      const hpList = e.HP as number[]
      const size = apList.length
      assert(
        apList.length === hpList.length,
        `invalid denco status: AP, HP, EXP size mismatch ${JSON.stringify(e)}`,
      )
      const status = Array(size).fill(0).map((_, i) => {
        let ap = Number(apList[i])
        let hp = Number(hpList[i])
        assert(
          Number.isInteger(ap) && Number.isInteger(hp),
          `ap, hp must be integer at[${i}] ${JSON.stringify(e)}`
        )
        let status: DencoLevelStatus = {
          level: i + 1,
          maxLevel: (i + 1) === size,
          ap: ap,
          maxHp: hp,
          nextExp: nextExp[i],
          numbering: e.numbering,
          name: e.name,
          fullName: e.full_name,
          firstName: e.first_name,
          type: e.type,
          attr: e.attr,
        }
        return status
      })
      this.data.set(e.numbering, status)
    }
  }

  clear() {
    this.data.clear()
  }

  getDenco(context: Context, numbering: string, level: number = 50, link: StationLink[] | number = []): DencoState {
    const status = this.getDencoStatus(numbering, level)
    if (!status) {
      context.log.error(`指定したレベルの情報がありません ${numbering} Lv.${level}`)
    }
    const skill = skillManager.getSkill(numbering, level)
    const linkList = (typeof link === "number") ?
      stationManager.getRandomLink(context, link) : link
    return {
      ...status,
      currentExp: status.maxLevel ? status.nextExp : 0, // 最大レベル80時は 68000/68000で固定
      currentHp: status.maxHp,
      skill: skill,
      film: { type: "none" },
      link: linkList,
    }
  }

  getDencoStatus(numbering: string, level: number): DencoLevelStatus | undefined {
    const data = this.data.get(numbering)
    if (!data) throw new SimulatorError(`denco data not found: ${numbering}`)
    if (level < 1 || level > data.length) {
      return undefined
    }
    return data[level - 1]
  }

}

const manager = new DencoManager()
export default manager