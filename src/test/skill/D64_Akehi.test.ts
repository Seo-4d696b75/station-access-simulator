import { activateSkill, init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
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
      offense.user.getDailyDistance = (_) => dist
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
      offense.user.getDailyDistance = (_) => dist
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
      offense.user.getDailyDistance = (_) => dist
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
      defense.user.getDailyDistance = (_) => 100
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


    test("発動なし-エリア無効化", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let akehi = DencoManager.getDenco(context, "64", 50)
      let eria = DencoManager.getDenco(context, "33", 50, 1)
      let offense = initUser(context, "とあるマスター", [akehi, seria])
      offense.user.getDailyDistance = (_) => 50
      let defense = initUser(context, "とあるマスター２", [eria])
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
        station: eria.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", akehi)).toBe(false)
      expect(hasSkillTriggered(result, "defense", eria)).toBe(true)
      expect(result.attackPercent).toBe(0)

      let t = getSkillTrigger(result, "offense", akehi)[0]
      expect(t.skillName).toBe("フレンドシップロード Lv.4")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
    })
  })

  describe("編成内ATK増加", () => {

    test.each([0.9, 1, 3, 5, 10, 30, 50, 99])("発動なし-攻撃側(編成内)-%fkm", (dist) => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let akehi = DencoManager.getDenco(context, "64", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [seria, akehi])
      offense.user.getDailyDistance = (_) => dist
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
      offense.user.getDailyDistance = (_) => dist
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

    test("発動あり-攻撃側(編成内)-エリア無効化影響なし", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let akehi = DencoManager.getDenco(context, "64", 50)
      let eria = DencoManager.getDenco(context, "33", 50, 1)
      let offense = initUser(context, "とあるマスター", [seria, akehi])
      offense.user.getDailyDistance = (_) => 120
      let defense = initUser(context, "とあるマスター２", [eria])
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
        station: eria.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", akehi)).toBe(true)
      expect(hasSkillTriggered(result, "defense", eria)).toBe(false)
      expect(result.attackPercent).toBe(7)
    })
  })
})