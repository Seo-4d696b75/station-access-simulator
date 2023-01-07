import { activateSkill, DencoAttribute, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("ひめのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "87",
    name: "hime",
    active: 900,
    cooldown: 5400,
  })
  describe("発動あり", () => {
    const attrList: DencoAttribute[] = [
      "cool",
      "eco",
      "heat",
      "flat"
    ]
    test.each(attrList)("ATK増加 %s", (attr) => {
      const context = initContext("test", "test", false)
      let hime = DencoManager.getDenco(context, "87", 50)
      let offense = initUser(context, "とあるマスター", [hime])
      offense = activateSkill(context, offense, 0)
      let siira = DencoManager.getDenco(context, "11", 50, 1)
      siira.attr = attr
      let defense = initUser(context, "とあるマスター２", [siira])
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
      expect(hasSkillTriggered(result.offense, hime)).toBe(true)
      expect(result.attackPercent).toBe(attr === "eco" ? 56 : 16)
    })
  })
  describe("発動なし", () => {
    test("編成内", () => {
      const context = initContext("test", "test", false)
      let saya = DencoManager.getDenco(context, "8", 50)
      let hime = DencoManager.getDenco(context, "87", 50)
      let offense = initUser(context, "とあるマスター", [saya, hime])
      offense = activateSkill(context, offense, 1)
      let siira = DencoManager.getDenco(context, "11", 50, 1)
      let defense = initUser(context, "とあるマスター２", [siira])
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
      expect(hasSkillTriggered(result.offense, hime)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
    test("被アクセス", () => {
      const context = initContext("test", "test", false)
      let saya = DencoManager.getDenco(context, "8", 50)
      let hime = DencoManager.getDenco(context, "87", 50, 1)
      let offense = initUser(context, "とあるマスター", [saya])
      let defense = initUser(context, "とあるマスター２", [hime])
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
        station: hime.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, hime)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
  })
})
