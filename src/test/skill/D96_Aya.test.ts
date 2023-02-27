import { activateSkill, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("アヤのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "96",
    name: "aya",
    active: 2700,
    cooldown: 8100,
  })

  test.each([1, 2, 3, 4, 5, 6, 7])("発動あり always x%d", (cnt) => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let aya = DencoManager.getDenco(context, "96", 50)
    let offense = initUser(context, "とあるマスター", [reika, aya])
    offense = activateSkill(context, offense, 1)
    let luna = DencoManager.getDenco(context, "3", 50)
    let miroku = DencoManager.getDenco(context, "4", 50)
    let sheena = DencoManager.getDenco(context, "7", 50)
    let siira = DencoManager.getDenco(context, "11", 50)
    let izuna = DencoManager.getDenco(context, "13", 50)
    let ringo = DencoManager.getDenco(context, "15", 50)
    let sigure = DencoManager.getDenco(context, "21", 50, 1)
    let defense = initUser(
      context, "とあるマスター２",
      [sigure, ringo, izuna, siira, sheena, miroku, luna].slice(0, cnt)
    )
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: sigure.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", aya)).toBe(true)
    expect(result.attackPercent).toBe(
      Math.floor(34 * Math.pow(cnt / 7, 2) * 100) / 100,
    )
    expect(result.defendPercent).toBe(0)
  })

  describe("発動なし", () => {
    test("自身", () => {
      const context = initContext("test", "test", false)
      let aya = DencoManager.getDenco(context, "96", 50)
      let offense = initUser(context, "とあるマスター", [aya])
      offense = activateSkill(context, offense, 0)
      let sigure = DencoManager.getDenco(context, "21", 50, 1)
      let defense = initUser(context, "とあるマスター２", [sigure])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: sigure.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", aya)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.defendPercent).toBe(0)
    })

    test("always相手編成なし", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let aya = DencoManager.getDenco(context, "96", 50)
      let offense = initUser(context, "とあるマスター", [reika, aya])
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
      expect(hasSkillTriggered(result, "offense", aya)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.defendPercent).toBe(0)
    })
  })

})