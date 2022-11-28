import assert from "assert"
import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { getFixedDamageDenco } from "../tool/fake"
import "../tool/matcher"
import { testAlwaysSkill } from "../tool/skillState"

describe("あけひのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "65",
    name: "hibiki"
  })

  describe("サポーターの無効化", () => {

    test("発動あり-守備側(被アクセス)", () => {
      const context = initContext("test", "test", false)
      let fubu = DencoManager.getDenco(context, "14", 50)
      let mio = DencoManager.getDenco(context, "36", 50)
      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let reika = DencoManager.getDenco(context, "5", 50)
      let defense = initUser(context, "とあるマスター", [hibiki, fubu, mio])
      defense = activateSkill(context, defense, 1, 2)
      let offense = initUser(context, "とあるマスター２", [charlotte, reika])
      offense = activateSkill(context, offense, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, hibiki)).toBe(true)
      // サポーターの無効化
      assert(result.defense)
      let d = result.defense.formation[1]
      expect(d.skillInvalidated).toBe(true)
      d = result.defense.formation[2]
      expect(d.skillInvalidated).toBe(true)
      expect(result.defendPercent).toBe(0)
      // 相手編成のサポーターは無効化対象外
      d = result.offense.formation[1]
      expect(d.skillInvalidated).toBe(false)
      expect(result.attackPercent).toBeGreaterThan(0)
    })

    test("発動なし-守備側(被アクセス)", () => {
      const context = initContext("test", "test", false)
      let fubu = DencoManager.getDenco(context, "14", 50)
      let mio = DencoManager.getDenco(context, "36", 50)
      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [hibiki, fubu, mio])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, hibiki)).toBe(false)
      // サポーターの無効化なし
      assert(result.defense)
      let d = result.defense.formation[1]
      expect(d.skillInvalidated).toBe(false)
      d = result.defense.formation[2]
      expect(d.skillInvalidated).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
    test("発動あり-守備側(被アクセス)-レン相手", () => {
      const context = initContext("test", "test", false)
      let fubu = DencoManager.getDenco(context, "14", 50)
      let mio = DencoManager.getDenco(context, "36", 50)
      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let ren = DencoManager.getDenco(context, "22", 50)
      let defense = initUser(context, "とあるマスター", [hibiki, fubu, mio])
      defense = activateSkill(context, defense, 1, 2)
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, ren)).toBe(true)
      expect(hasSkillTriggered(result.defense, hibiki)).toBe(true)
      // スキル無効化は互いに影響しない！！
      // 相手ディフェンダー無効化
      assert(result.defense)
      let d = result.defense.formation[0]
      expect(d.skillInvalidated).toBe(true)
      // サポーターの無効化
      d = result.defense.formation[1]
      expect(d.skillInvalidated).toBe(true)
      d = result.defense.formation[2]
      expect(d.skillInvalidated).toBe(true)
      expect(result.defendPercent).toBe(0)
    })
  })

  describe("HP回復", () => {
    test("発動あり-守備側(被アクセス)", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      const now = context.currentTime
      context.clock = now

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [hibiki])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, hibiki)).toBe(false)
      // HP回復
      assert(result.defense)
      expect(result.defense.event.length).toBe(2)
      let e = result.defense.event[1]
      assert(e.type === "skill_trigger")
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
      expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.99)
      expect(e.data.carIndex).toBe(0)
      expect(e.data.step).toBe("self")
      expect(e.data.skillName).toBe("シンフォニックレイル Lv.4")
      expect(e.data.time).toBe(now)
      expect(e.data.denco).toMatchDencoState(d)
      const heal = Math.floor(d.maxHp * 0.15)
      expect(d.currentHp).toBe(d.hpAfter + heal)
    })

    test("発動あり-守備側(被アクセス)-確率ブースト", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      const now = context.currentTime
      context.clock = now

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [hibiki, hiiru])
      defense = activateSkill(context, defense, 1)
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      // ひいるはサポーターなので無効化される！
      expect(hasSkillTriggered(result.defense, hibiki)).toBe(true)
      // HP回復
      assert(result.defense)
      expect(result.defense.event.length).toBe(2)
      let e = result.defense.event[1]
      assert(e.type === "skill_trigger")
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
      expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.99)
      expect(e.data.carIndex).toBe(0)
      expect(e.data.step).toBe("self")
      expect(e.data.skillName).toBe("シンフォニックレイル Lv.4")
      expect(e.data.time).toBe(now)
      expect(e.data.denco).toMatchDencoState(d)
      const heal = Math.floor(d.maxHp * 0.15)
      expect(d.currentHp).toBe(d.hpAfter + heal)
    })

    test("発動なし-守備側(被アクセス)-確率", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [hibiki])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, hibiki)).toBe(false)
      // HP回復なし
      assert(result.defense)
      expect(result.defense.event.length).toBe(1)
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
      expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.99)
      expect(d.currentHp).toBe(d.hpAfter)
    })

    test("発動なし-守備側(被アクセス)-レン相手（無効化）", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let ren = DencoManager.getDenco(context, "22", 50)
      let defense = initUser(context, "とあるマスター", [hibiki])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, hibiki)).toBe(false)
      // HP回復なし
      assert(result.defense)
      expect(result.defense.event.length).toBe(1)
      let d = result.defense.formation[0]
      expect(d.skillInvalidated).toBe(true)
      expect(d.hpAfter).toBe(d.maxHp - Math.floor(ren.ap * 1.3))
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.99)
      expect(d.currentHp).toBe(d.hpAfter)
    })


    test("発動なし-守備側(被アクセス)-99%以上", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      charlotte.ap = 1
      let defense = initUser(context, "とあるマスター", [hibiki])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, hibiki)).toBe(false)
      // HP回復なし
      assert(result.defense)
      expect(result.defense.event.length).toBe(1)
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBe(d.maxHp - 1)
      expect(d.hpAfter).toBeGreaterThan(d.maxHp * 0.99)
      expect(d.currentHp).toBe(d.hpAfter)
    })
    test("発動なし-守備側(被アクセス)-HP変化なし", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      hibiki.currentHp = Math.floor(hibiki.maxHp * 0.99)
      let test = getFixedDamageDenco(-1000)
      test.type = "trickster" // サポーターだと無効化される
      let charlotte = DencoManager.getDenco(context, "6", 50)
      charlotte.ap = 100
      let defense = initUser(context, "とあるマスター", [hibiki, test])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, hibiki)).toBe(false)
      // HP回復なし
      // 最大HPの99%以下でもアクセスで変化がないと発動しない
      assert(result.defense)
      expect(result.defense.event.length).toBe(1)
      let d = result.defense.formation[0]
      expect(d.damage?.value).toBe(0)
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBe(d.hpBefore)
      expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.99)
      expect(d.currentHp).toBe(d.hpAfter)
    })
  })
})