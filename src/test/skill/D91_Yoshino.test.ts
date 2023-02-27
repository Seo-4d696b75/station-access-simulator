import assert from "assert"
import { activateSkill, DencoAttribute, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("よしののスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "91",
    name: "yoshino",
    active: 2700,
    cooldown: 8100,
  })

  describe("DEF増減", () => {
    test.each(["heat", "cool", "eco", "flat"])("属性：%s", (attr) => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      reika.attr = attr as DencoAttribute
      let offense = initUser(context, "とあるマスター", [reika])
      let yoshino = DencoManager.getDenco(context, "91", 50, 1)
      yoshino.currentHp = 1
      let defense = initUser(context, "とあるマスター２", [yoshino])
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
        station: yoshino.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkDisconnected).toBe(true)
      expect(hasSkillTriggered(result, "defense", yoshino)).toBe(
        attr === "heat" || attr === "cool"
      )
      expect(result.defendPercent).toBe(
        attr === "heat"
          ? -10
          : attr === "cool"
            ? 15
            : 0
      )
    })
  })

  describe("経験値・スコア追加", () => {

    test("リンク維持", () => {
      const context = initContext("test", "test", false)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      charlotte.ap = 1
      let offense = initUser(context, "とあるマスター", [charlotte])
      let yoshino = DencoManager.getDenco(context, "91", 50, 1)
      let defense = initUser(context, "とあるマスター２", [yoshino])
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
        station: yoshino.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkDisconnected).toBe(false)
      expect(hasSkillTriggered(result, "defense", yoshino)).toBe(true)
      expect(result.defendPercent).toBe(0) // DEF変化なし
      assert(result.defense)
      // 経験値
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.damage?.value).toBeGreaterThan(0)
      expect(d.exp.skill).toBe(250)
      expect(d.exp.link).toBe(0)
      expect(d.exp.access.total).toBe(0)
      expect(d.exp.total).toBe(250)
      // スコア
      expect(result.defense.score.skill).toBe(320)
      expect(result.defense.score.link).toBe(0)
      expect(result.defense.score.access.total).toBe(0)
      expect(result.defense.score.total).toBe(320)
    })
    test("足湯", () => {
      const context = initContext("test", "test", false)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let offense = initUser(context, "とあるマスター", [charlotte])
      let yoshino = DencoManager.getDenco(context, "91", 50, 1)
      let defense = initUser(context, "とあるマスター２", [yoshino])
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
        usePink: true,
        station: yoshino.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkDisconnected).toBe(true)
      expect(hasSkillTriggered(result, "defense", yoshino)).toBe(true)
      expect(result.defendPercent).toBe(0) // DEF変化なし
      assert(result.defense)
      // リンク解除してもリブートしなければOK
      // 経験値
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.damage).toBeUndefined()
      expect(d.exp.skill).toBe(250)
      expect(d.exp.link).toBeGreaterThan(0)
      expect(d.exp.access.total).toBe(0)
      expect(d.exp.total).toBe(250 + d.exp.link)
      // スコア
      expect(result.defense.score.skill).toBe(320)
      expect(result.defense.score.link).toBeGreaterThan(0)
      expect(result.defense.score.access.total).toBe(0)
      expect(result.defense.score.total).toBe(320 + result.defense.score.link)
    })
    test("リブート", () => {
      const context = initContext("test", "test", false)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      charlotte.ap = 300
      let offense = initUser(context, "とあるマスター", [charlotte])
      let yoshino = DencoManager.getDenco(context, "91", 50, 1)
      let defense = initUser(context, "とあるマスター２", [yoshino])
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
        station: yoshino.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkDisconnected).toBe(true)
      expect(hasSkillTriggered(result, "defense", yoshino)).toBe(false)
      expect(result.defendPercent).toBe(0) // DEF変化なし
      assert(result.defense)
      // 経験値
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(true)
      expect(d.damage?.value).toBeGreaterThan(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBeGreaterThan(0)
      expect(d.exp.access.total).toBe(0)

      // スコア
      expect(result.defense.score.skill).toBe(0)
      expect(result.defense.score.link).toBeGreaterThan(0)
      expect(result.defense.score.access.total).toBe(0)
    })
  })
})