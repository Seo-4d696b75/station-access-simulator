import { activateSkill, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("ひなのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "95",
    name: "hina",
    active: 3600,
    cooldown: 9000,
  })

  describe("編成内", () => {
    test("アクセス側", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let hina = DencoManager.getDenco(context, "95", 50)
      let offense = initUser(context, "とあるマスター", [reika, hina])
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
      expect(hasSkillTriggered(result, "offense", hina)).toBe(true)
      expect(result.attackPercent).toBe(-10.5)
      expect(result.defendPercent).toBe(0)
    })
    test("守備側", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let hina = DencoManager.getDenco(context, "95", 50)
      let defense = initUser(context, "とあるマスター", [reika, hina])
      defense = activateSkill(context, defense, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
      expect(hasSkillTriggered(result, "defense", hina)).toBe(true)
      expect(result.attackPercent).toBe(-10.5)
      expect(result.defendPercent).toBe(0)
    })
  })

  describe("自身", () => {
    test("アクセス側", () => {
      const context = initContext("test", "test", false)
      let hina = DencoManager.getDenco(context, "95", 50)
      let offense = initUser(context, "とあるマスター", [hina])
      offense = activateSkill(context, offense, 0)
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
      expect(hasSkillTriggered(result, "offense", hina)).toBe(true)
      expect(result.attackPercent).toBe(-10.5)
      expect(result.defendPercent).toBe(0)
    })
    test("守備側", () => {
      const context = initContext("test", "test", false)
      let hina = DencoManager.getDenco(context, "95", 50, 1)
      let defense = initUser(context, "とあるマスター", [hina])
      defense = activateSkill(context, defense, 0)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
        station: hina.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", hina)).toBe(true)
      expect(result.attackPercent).toBe(-10.5)
      expect(result.defendPercent).toBe(0)
    })
  })

})