import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("コヨイのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "74",
    name: "koyoi",
    active: 5400,
    cooldown: 7200,
  })

  describe("編成内DEF増加", () => {
    test.each([0, 1, 2, 3, 4, 5, 6])("守備側(編成内)-eco x%s", (count) => {

      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let mero = DencoManager.getDenco(context, "2", 50)
      let luna = DencoManager.getDenco(context, "3", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let reika = DencoManager.getDenco(context, "5", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let koyoi = DencoManager.getDenco(context, "74", 50)
      let sheena = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [seria, mero, luna, miroku, reika, charlotte, koyoi])
      defense = activateSkill(context, defense, 6)
      // eco属性数の調整
      defense.formation.slice(0, 6).forEach((d, i) => d.attr = i < count ? "eco" : "heat")
      let offense = initUser(context, "とあるマスター２", [sheena])
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
      expect(hasSkillTriggered(result.defense, koyoi)).toBe(count >= 4)
      expect(result.defendPercent).toBe(count >= 4 ? 10 : 0)
    })
  })

  describe("自身DEF増加", () => {

    test.each([0, 1, 2, 3, 4, 5, 6])("守備側(被アクセス)-eco x%s", (count) => {

      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let mero = DencoManager.getDenco(context, "2", 50)
      let luna = DencoManager.getDenco(context, "3", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let reika = DencoManager.getDenco(context, "5", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let koyoi = DencoManager.getDenco(context, "74", 50, 1)
      let sheena = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [koyoi, seria, mero, luna, miroku, reika, charlotte])
      defense = activateSkill(context, defense, 0)
      // eco属性数の調整
      defense.formation.slice(1, 7).forEach((d, i) => d.attr = i < count ? "eco" : "heat")
      let offense = initUser(context, "とあるマスター２", [sheena])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: koyoi.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, koyoi)).toBe(count > 0)
      // count >= 4 で編成内効果も発動
      const selfDef = 31 * Math.min(count, 5) / 5
      const otherDef = count >= 4 ? 10 : 0
      expect(result.defendPercent).toBe(selfDef + otherDef)
    })
  })

  describe("スキル無効化の影響-守備側", () => {
    test("発動あり-守備側(編成内)-無効化なし", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let mero = DencoManager.getDenco(context, "2", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let moe = DencoManager.getDenco(context, "9", 50)
      let koyoi = DencoManager.getDenco(context, "74", 50)
      let ren = DencoManager.getDenco(context, "22", 50)
      let defense = initUser(context, "とあるマスター", [seria, mero, charlotte, moe, koyoi])
      defense = activateSkill(context, defense, 4)
      let offense = initUser(context, "とあるマスター２", [ren])
      offense = activateSkill(context, offense, 0)
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
      expect(hasSkillTriggered(result.offense, ren)).toBe(false)
      expect(hasSkillTriggered(result.defense, koyoi)).toBe(true)
      expect(result.defendPercent).toBe(10)
    })
    test("発動なし-守備側(被アクセス)-無効化", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let mero = DencoManager.getDenco(context, "2", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let moe = DencoManager.getDenco(context, "9", 50)
      let koyoi = DencoManager.getDenco(context, "74", 50, 1)
      let ren = DencoManager.getDenco(context, "22", 50)
      let defense = initUser(context, "とあるマスター", [koyoi, seria, mero, charlotte, moe])
      defense = activateSkill(context, defense, 0)
      let offense = initUser(context, "とあるマスター２", [ren])
      offense = activateSkill(context, offense, 0)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: koyoi.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, ren)).toBe(true)
      expect(hasSkillTriggered(result.defense, koyoi)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
  })
})