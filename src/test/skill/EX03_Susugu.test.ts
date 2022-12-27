import assert from "assert"
import { dayjs, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { testManualSkill } from "../tool/skillState"

describe("すすぐのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "EX03",
    name: "susugu",
    active: 1080,
    cooldown: 15120,
  })


  describe("発動あり", () => {

    test("基本", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T12:00:00").valueOf()
      let ringo = DencoManager.getDenco(context, "15", 50)
      let susugu = DencoManager.getDenco(context, "EX03", 50)
      let rara = DencoManager.getDenco(context, "56", 80, 1)
      let offense = initUser(context, "とあるマスター", [ringo, susugu])
      offense = activateSkill(context, offense, 1)
      let defense = initUser(context, "とあるマスター２", [rara])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: rara.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, susugu)).toBe(true)
      expect(hasSkillTriggered(result.offense, ringo)).toBe(false)
      expect(hasSkillTriggered(result.defense, rara)).toBe(false)
      // 無効化
      assert(result.defense)
      expect(result.offense.formation[0].skillInvalidated).toBe(true)
      expect(result.defense.formation[0].skillInvalidated).toBe(true)
    })

    test("確率ブースト", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T12:00:00").valueOf()
      let ringo = DencoManager.getDenco(context, "15", 50)
      let susugu = DencoManager.getDenco(context, "EX03", 50)
      let reika = DencoManager.getDenco(context, "5", 60, 1)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let seria = DencoManager.getDenco(context, "1", 50)
      let offense = initUser(context, "とあるマスター", [ringo])
      let defense = initUser(context, "とあるマスター２", [reika, seria, hiiru, susugu])
      defense = activateSkill(context, defense, 1, 2, 3)
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
      expect(hasSkillTriggered(result.offense, ringo)).toBe(false)
      expect(hasSkillTriggered(result.defense, susugu)).toBe(true)
      // ひいるは無効化スキルの前に発動済み
      expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
      // 無効化
      assert(result.defense)
      expect(result.offense.formation[0].skillInvalidated).toBe(true)
      // セリアは無効化対象外
      expect(result.defense.formation[1].skillInvalidated).toBe(false)
      // ひいるは無効化される
      expect(result.defense.formation[2].skillInvalidated).toBe(true)
      // アクセス直後に発動するセリアのスキル発動確率ブーストはしない
      assert(result.defense)
      expect(result.defense.event.length).toBe(2)
      let e = result.defense.event[1]
      assert(e.type === "skill_trigger")
      expect(e.data.step).toBe("self")
      expect(e.data.denco).toMatchDenco(seria)
    })
    describe("攻守による無効化の順序", () => {
      test("攻撃側のレンを守備側のすすぐでは発動防げない", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        context.clock = dayjs("2022-01-01T23:00:00").valueOf()
        let ren = DencoManager.getDenco(context, "22", 50)
        let reika = DencoManager.getDenco(context, "5", 50)
        let susugu = DencoManager.getDenco(context, "EX03", 50)
        let luna = DencoManager.getDenco(context, "3", 80, 1)
        let offense = initUser(context, "とあるマスター", [ren, reika])
        offense = activateSkill(context, offense, 0, 1)
        let defense = initUser(context, "とあるマスター２", [luna, susugu])
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
          station: luna.link[0],
        }
        const result = startAccess(context, config)
        expect(result.defense).not.toBeUndefined()
        // 攻撃側のレンが先に発動する
        // 守備側のすすぐが発動してレンのスキル無効化されるも発動済み
        // レイカは無効化され発動しない
        expect(hasSkillTriggered(result.offense, ren)).toBe(true)
        expect(hasSkillTriggered(result.offense, reika)).toBe(false)
        expect(hasSkillTriggered(result.defense, luna)).toBe(false)
        expect(hasSkillTriggered(result.defense, susugu)).toBe(true)
        // 無効化
        assert(result.defense)
        expect(result.offense.formation[0].skillInvalidated).toBe(true)
        expect(result.offense.formation[1].skillInvalidated).toBe(true)
        expect(result.defense.formation[0].skillInvalidated).toBe(true)
      })
      test("攻撃側のてすとで守備側のすすぐが無効化され発動しない", () => {
        // TODO
      })
    })
  })



  describe("発動なし", () => {

    test("足湯", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T12:00:00").valueOf()
      let ringo = DencoManager.getDenco(context, "15", 50)
      let susugu = DencoManager.getDenco(context, "EX03", 50)
      let rara = DencoManager.getDenco(context, "56", 80, 1)
      let offense = initUser(context, "とあるマスター", [ringo, susugu])
      offense = activateSkill(context, offense, 1)
      let defense = initUser(context, "とあるマスター２", [rara])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: rara.link[0],
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, susugu)).toBe(false)
      expect(hasSkillTriggered(result.offense, ringo)).toBe(false)
      expect(hasSkillTriggered(result.defense, rara)).toBe(false)
      // 無効化なし
      assert(result.defense)
      expect(result.offense.formation[0].skillInvalidated).toBe(false)
      expect(result.defense.formation[0].skillInvalidated).toBe(false)
    })
    test("相手不在", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T12:00:00").valueOf()
      let ringo = DencoManager.getDenco(context, "15", 50)
      let susugu = DencoManager.getDenco(context, "EX03", 50)
      let rara = DencoManager.getDenco(context, "56", 80, 1)
      let offense = initUser(context, "とあるマスター", [ringo, susugu])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: undefined,
        station: rara.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).toBeUndefined()
      expect(hasSkillTriggered(result.offense, susugu)).toBe(false)
      expect(hasSkillTriggered(result.offense, ringo)).toBe(false)
      // 無効化なし
      expect(result.offense.formation[0].skillInvalidated).toBe(false)
    })
  })
})