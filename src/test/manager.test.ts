import { Context, initContext } from "../core/context"
import StationManager from "../core/stationManager"

const stations = [
  {
    name: "適当な駅１",
    name_kana: "てきとうなえきいち",
    attr: "heat",
  },
  {
    name: "適当な駅２",
    name_kana: "てきとうなえきに",
    attr: "cool",
  }
]

describe("manager", () => {
  test("station-manager", () => {
    StationManager.load(JSON.stringify(stations)).then(() => {
      const context = initContext("test", "test", false)
      expect(StationManager.data.length).toBe(2)
      const s = StationManager.getRandomStation(context, 2).find(s => s.name === "適当な駅１")
      expect(s).not.toBeUndefined()
      expect(s?.nameKana).toBe(stations[0].name_kana)
      expect(s?.attr).toBe("heat")
      const now = Date.now()
      const link = StationManager.getRandomLink(context, 1, 1, 2)[0]
      expect(link.start).toBeGreaterThan(now - 2000)
      expect(link.start).toBeLessThanOrEqual(now - 1000)
      expect(() => StationManager.getRandomStation(context, 10)).toThrowError()
      expect(() => StationManager.getRandomLink(context, 10)).toThrowError()
    })
  })
})