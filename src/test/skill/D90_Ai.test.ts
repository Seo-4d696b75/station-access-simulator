import { activateSkill, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("あいのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "90",
    name: "ai",
    active: 2700,
    cooldown: 11700,
  })

  describe("発動あり", () => {

    test("編成内", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let saya = DencoManager.getDenco(context, "8", 50)
      let offense = initUser(context, "とあるマスター", [reika, saya])
      let mobo = DencoManager.getDenco(context, "12", 50, 1)
      let ai = DencoManager.getDenco(context, "90", 50)
      let defense = initUser(context, "とあるマスター２", [mobo, ai])
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
        station: mobo.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", ai)).toBe(true)
      expect(result.defendPercent).toBe(12)
    })
    test("追加DEF", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let offense = initUser(context, "とあるマスター", [reika, miroku])
      let mobo = DencoManager.getDenco(context, "12", 50, 1)
      let ai = DencoManager.getDenco(context, "90", 50)
      let defense = initUser(context, "とあるマスター２", [mobo, ai])
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
        station: mobo.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", ai)).toBe(true)
      expect(result.defendPercent).toBe(12 + 14)
    })
  })
  describe("発動なし", () => {

    test("自身", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let saya = DencoManager.getDenco(context, "8", 50)
      let offense = initUser(context, "とあるマスター", [reika, saya])
      let ai = DencoManager.getDenco(context, "90", 50, 1)
      let defense = initUser(context, "とあるマスター２", [ai])
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
        station: ai.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", ai)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
    test("編成内cool以外", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"
      let reika = DencoManager.getDenco(context, "5", 50)
      let saya = DencoManager.getDenco(context, "8", 50)
      let offense = initUser(context, "とあるマスター", [reika, saya])
      let siira = DencoManager.getDenco(context, "11", 50, 1)
      let ai = DencoManager.getDenco(context, "90", 50)
      let defense = initUser(context, "とあるマスター２", [siira, ai])
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
        station: siira.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", ai)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
  })
})