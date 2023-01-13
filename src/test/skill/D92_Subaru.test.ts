import { activateSkill, DencoType, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { testAlwaysSkill } from "../tool/skillState"

describe("すばるのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "92",
    name: "subaru",
  })

  const typeList: DencoType[] = [
    "attacker",
    "trickster",
    "supporter",
    "defender"
  ]

  describe("ATK増加", () => {

    test.each(typeList)("先頭-%s", (type) => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let reika = DencoManager.getDenco(context, "5", 50)
      reika.type = type
      let subaru = DencoManager.getDenco(context, "92", 50)
      let offense = initUser(context, "とあるマスター", [reika, subaru])
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
      const trigger = (type === "attacker" || type === "trickster")
      expect(hasSkillTriggered(result.offense, subaru)).toBe(trigger)
      expect(result.attackPercent).toBe(trigger ? 16 : 0)
      expect(result.defendPercent).toBe(0)
    })
    test.each(typeList)("自身先頭-%s", (type) => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let reika = DencoManager.getDenco(context, "5", 50)
      reika.type = type
      let subaru = DencoManager.getDenco(context, "92", 50)
      let offense = initUser(context, "とあるマスター", [subaru, reika])
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let defense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      const trigger = (type === "attacker" || type === "trickster")
      expect(hasSkillTriggered(result.offense, subaru)).toBe(trigger)
      expect(result.attackPercent).toBe(trigger ? 16 : 0)
      expect(result.defendPercent).toBe(0)
    })
    test("発動なし-編成位置対象外", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let reika = DencoManager.getDenco(context, "5", 50)
      let seria = DencoManager.getDenco(context, "1", 50)
      let subaru = DencoManager.getDenco(context, "92", 50)
      let offense = initUser(context, "とあるマスター", [reika, seria, subaru])
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let defense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, subaru)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.defendPercent).toBe(0)
    })

    test("発動あり-確率補正", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let sheena = DencoManager.getDenco(context, "7", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let subaru = DencoManager.getDenco(context, "92", 50)
      let offense = initUser(context, "とあるマスター", [sheena, hiiru, subaru])
      offense = activateSkill(context, offense, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
      expect(hasSkillTriggered(result.offense, subaru)).toBe(true)
      expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
      expect(result.attackPercent).toBe(16)
      expect(result.defendPercent).toBe(0)
    })
    test("発動なし-確率", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"
      let sheena = DencoManager.getDenco(context, "7", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let subaru = DencoManager.getDenco(context, "92", 50)
      let offense = initUser(context, "とあるマスター", [sheena, hiiru, subaru])
      offense = activateSkill(context, offense, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
      expect(hasSkillTriggered(result.offense, subaru)).toBe(false)
      expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
      expect(result.attackPercent).toBe(0)
      expect(result.defendPercent).toBe(0)
    })
  })

  describe("DEF増加", () => {

    test.each(typeList)("先頭-%s", (type) => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      reika.type = type
      let subaru = DencoManager.getDenco(context, "92", 50)
      let defense = initUser(context, "とあるマスター", [reika, subaru])
      let charlotte = DencoManager.getDenco(context, "6", 50)
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
        station: reika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      const trigger = (type === "supporter" || type === "defender")
      expect(hasSkillTriggered(result.defense, subaru)).toBe(trigger)
      expect(result.attackPercent).toBe(0)
      expect(result.defendPercent).toBe(trigger ? 16 : 0)
    })
    test.each(typeList)("自身先頭-%s", (type) => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      reika.type = type
      let subaru = DencoManager.getDenco(context, "92", 50)
      let defense = initUser(context, "とあるマスター", [subaru, reika])
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let offense = initUser(context, "とあるマスター２", [charlotte])
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
      const trigger = (type === "supporter" || type === "defender")
      expect(hasSkillTriggered(result.defense, subaru)).toBe(trigger)
      expect(result.attackPercent).toBe(0)
      expect(result.defendPercent).toBe(trigger ? 16 : 0)
    })

    test("発動なし-自身先頭", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let subaru = DencoManager.getDenco(context, "92", 50, 1)
      let defense = initUser(context, "とあるマスター", [subaru])
      let charlotte = DencoManager.getDenco(context, "6", 50)
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
        station: subaru.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, subaru)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.defendPercent).toBe(0)
    })

    test("発動なし-編成位置対象外", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let reika = DencoManager.getDenco(context, "5", 50)
      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let subaru = DencoManager.getDenco(context, "92", 50)
      let defense = initUser(context, "とあるマスター", [reika, seria, subaru])
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let offense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 1
        },
        station: seria.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, subaru)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.defendPercent).toBe(0)
    })
  })

})