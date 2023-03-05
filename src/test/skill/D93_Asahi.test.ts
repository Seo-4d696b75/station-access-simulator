import { activateSkill, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("あさひのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "93",
    name: "asahi",
    active: 3600,
    cooldown: 10800,
  })

  describe("DEF増加", () => {

    test("発動あり", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let offense = initUser(context, "とあるマスター", [reika])
      let asahi = DencoManager.getDenco(context, "93", 50, 1)
      let defense = initUser(context, "とあるマスター２", [asahi])
      defense = activateSkill(context, defense, 0)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: asahi.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", asahi)).toBe(true)
      expect(result.defendPercent).toBe(14)
    })
    test("発動なし-編成内", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let offense = initUser(context, "とあるマスター", [reika])
      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let asahi = DencoManager.getDenco(context, "93", 50)
      let defense = initUser(context, "とあるマスター２", [seria, asahi])
      defense = activateSkill(context, defense, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: seria.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", asahi)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
  })

  describe("DEF追加増加", () => {

    test.each([0, 1, 2, 3, 4, 5, 6])("相手編成内のactive数 x%d", (cnt) => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let reika = DencoManager.getDenco(context, "5", 50)
      let fubu = DencoManager.getDenco(context, "14", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let mio = DencoManager.getDenco(context, "36", 50)
      let naho = DencoManager.getDenco(context, "50", 50)
      let offense = initUser(context, "とあるマスター", [seria, reika, fubu, hiiru, mio, naho])
      offense = activateSkill(context, offense, ...new Array(cnt).fill(0).map((_, i) => i))
      let asahi = DencoManager.getDenco(context, "93", 50, 1)
      let defense = initUser(context, "とあるマスター２", [asahi])
      defense = activateSkill(context, defense, 0)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: asahi.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", asahi)).toBe(true)
      expect(result.defendPercent).toBe(14 + (cnt >= 4 ? 35 : 0))
    })
  })

})