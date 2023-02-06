import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../tool/skillState"

describe("あけひのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "64",
    name: "akehi"
  })

  describe("自身のATK増加", () => {

    test.each([1, 2, 3, 5, 10, 30, 50, 80, 99])("発動あり-攻撃側(アクセス)-%dkm", (dist) => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let akehi = DencoManager.getDenco(context, "64", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [akehi, seria])
      offense.user.daily = {
        distance: dist
      }
      let defense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", akehi)).toBe(true)
      expect(result.attackPercent).toBe(0.21 * dist)
    })


    test.each([0.0, 0.1, 0.5, 0.99])("発動なし-攻撃側(アクセス)-%fkm", (dist) => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let akehi = DencoManager.getDenco(context, "64", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [akehi, seria])
      offense.user.daily = {
        distance: dist
      }
      let defense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", akehi)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })

    test.each([100, 101, 110, 150, 200, 500])("発動あり-攻撃側(アクセス)-%dkm", (dist) => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let akehi = DencoManager.getDenco(context, "64", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [akehi, seria])
      offense.user.daily = {
        distance: dist
      }
      let defense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", akehi)).toBe(true)
      expect(result.attackPercent).toBe(0.21 * 100 + 7)
    })


    test("発動なし-守備側(被アクセス)", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let akehi = DencoManager.getDenco(context, "64", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [akehi, seria])
      defense.user.daily = {
        distance: 100
      }
      let offense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: akehi.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", akehi)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
  })

  describe("編成内ATK増加", () => {

    test.each([0.9, 1, 3, 5, 10, 30, 50, 99])("発動なし-攻撃側(編成内)-%fkm", (dist) => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let akehi = DencoManager.getDenco(context, "64", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [seria, akehi])
      offense.user.daily = {
        distance: dist
      }
      let defense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", akehi)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
    test.each([100, 130, 150, 200, 500])("発動あり-攻撃側(編成内)-%fkm", (dist) => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let akehi = DencoManager.getDenco(context, "64", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [seria, akehi])
      offense.user.daily = {
        distance: dist
      }
      let defense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", akehi)).toBe(true)
      expect(result.attackPercent).toBe(7)
    })
  })
})