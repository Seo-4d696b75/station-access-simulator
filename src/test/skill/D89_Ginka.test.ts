import { activateSkill, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("ギンカのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "89",
    name: "ginka",
    active: 2700,
    cooldown: 8100,
  })

  test("発動あり", () => {
    const context = initContext("test", "test", false)
    let saya = DencoManager.getDenco(context, "8", 50)
    let hime = DencoManager.getDenco(context, "87", 50)
    let offense = initUser(context, "とあるマスター", [saya, hime])
    let ginka = DencoManager.getDenco(context, "89", 50, 1)
    let defense = initUser(context, "とあるマスター２", [ginka])
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
      station: ginka.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, ginka)).toBe(true)
    expect(result.defendPercent).toBe(42)
  })

  describe("発動なし", () => {

    test("最大HP未満", () => {
      const context = initContext("test", "test", false)
      let saya = DencoManager.getDenco(context, "8", 50)
      let hime = DencoManager.getDenco(context, "87", 50)
      let offense = initUser(context, "とあるマスター", [saya, hime])
      let ginka = DencoManager.getDenco(context, "89", 50, 1)
      ginka.currentHp = ginka.maxHp - 1
      let defense = initUser(context, "とあるマスター２", [ginka])
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
        station: ginka.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, ginka)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
    test("編成内", () => {
      const context = initContext("test", "test", false)
      let saya = DencoManager.getDenco(context, "8", 50)
      let hime = DencoManager.getDenco(context, "87", 50)
      let offense = initUser(context, "とあるマスター", [saya, hime])
      let ginka = DencoManager.getDenco(context, "89", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let defense = initUser(context, "とあるマスター２", [charlotte, ginka])
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
      expect(hasSkillTriggered(result.defense, ginka)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
  })
})