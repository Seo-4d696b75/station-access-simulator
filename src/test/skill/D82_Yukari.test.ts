import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("ゆかりのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "82",
    name: "yukari",
    active: 1800,
    cooldown: 7200,
  })

  describe("先頭のDEF増加", () => {
    test("発動なし-自身先頭", () => {
      const context = initContext("test", "test", false)
      let yukari = DencoManager.getDenco(context, "82", 50, 1)
      let reika = DencoManager.getDenco(context, "5", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let offense = initUser(context, "とあるマスター", [miroku])
      let defense = initUser(context, "とあるマスター", [yukari, reika])
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
        station: yukari.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", yukari)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
    test("発動あり-自身先頭", () => {
      const context = initContext("test", "test", false)
      let yukari = DencoManager.getDenco(context, "82", 50)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let offense = initUser(context, "とあるマスター", [miroku])
      let defense = initUser(context, "とあるマスター", [yukari, reika])
      defense = activateSkill(context, defense, 0)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 1
        },
        station: reika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", yukari)).toBe(true)
      expect(result.defendPercent).toBe(4)

    })
    test("発動なし-自身先頭以外", () => {
      const context = initContext("test", "test", false)
      let yukari = DencoManager.getDenco(context, "82", 50, 1)
      let reika = DencoManager.getDenco(context, "5", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let offense = initUser(context, "とあるマスター", [miroku])
      let defense = initUser(context, "とあるマスター", [reika, yukari])
      defense = activateSkill(context, defense, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 1
        },
        station: yukari.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", yukari)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
    test("発動あり-自身先頭以外", () => {
      const context = initContext("test", "test", false)
      let yukari = DencoManager.getDenco(context, "82", 50)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let offense = initUser(context, "とあるマスター", [miroku])
      let defense = initUser(context, "とあるマスター", [reika, yukari])
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
        station: reika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", yukari)).toBe(true)
      expect(result.defendPercent).toBe(4)

    })
  })

  describe("ecoのDEF増加", () => {
    test.each([2, 3, 4, 5, 6])("eco x %d", (cnt) => {
      const context = initContext("test", "test", false)
      let yukari = DencoManager.getDenco(context, "82", 50, 1)
      let mero = DencoManager.getDenco(context, "2", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let moe = DencoManager.getDenco(context, "9", 50)
      let iroha = DencoManager.getDenco(context, "10", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let offense = initUser(context, "とあるマスター", [miroku])
      let defense = initUser(
        context,
        "とあるマスター",
        [yukari, mero, charlotte, moe, iroha, siira].slice(0, cnt),
      )
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
        station: yukari.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", yukari)).toBe(cnt >= 4)
      expect(result.defendPercent).toBe(cnt >= 4 ? 20 : 0)
    })
    test("eco以外は対象外", () => {
      const context = initContext("test", "test", false)
      let yukari = DencoManager.getDenco(context, "82", 50)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let moe = DencoManager.getDenco(context, "9", 50)
      let iroha = DencoManager.getDenco(context, "10", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let offense = initUser(context, "とあるマスター", [miroku])
      let defense = initUser(
        context,
        "とあるマスター",
        [charlotte, reika, yukari, moe, iroha, siira]
      )
      defense = activateSkill(context, defense, 2)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 1
        },
        station: reika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", yukari)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
  })

  test("先頭＆eco　DEF増加", () => {
    const context = initContext("test", "test", false)
    let yukari = DencoManager.getDenco(context, "82", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let moe = DencoManager.getDenco(context, "9", 50)
    let iroha = DencoManager.getDenco(context, "10", 50)
    let siira = DencoManager.getDenco(context, "11", 50)
    let miroku = DencoManager.getDenco(context, "4", 50)
    let offense = initUser(context, "とあるマスター", [miroku])
    let defense = initUser(
      context,
      "とあるマスター",
      [charlotte, yukari, moe, iroha, siira]
    )
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
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", yukari)).toBe(true)
    expect(result.defendPercent).toBe(4 + 20)
  })
})
