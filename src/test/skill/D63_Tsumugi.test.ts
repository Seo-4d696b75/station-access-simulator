import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser, refreshState } from "../../core/user"
import { testManualSkill } from "../skillState"

describe("つむぎのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "63",
    name: "tsumugi",
    active: 2700,
    cooldown: 10800,
  })

  /*
    let seria = DencoManager.getDenco(context, "1", 50) // active: 1800 sec 
    let reika = DencoManager.getDenco(context, "5", 50) // active: 900 sec
    let fubu = DencoManager.getDenco(context, "14", 50) // active: 1800 sec
    let imura = DencoManager.getDenco(context, "19", 50) // active: 900 sec
    let hokone = DencoManager.getDenco(context, "26", 50) // active: 1200 sec
    let tsumugi = DencoManager.getDenco(context, "63", 50) // active: 2700 sec
  */
  const dencoList = ["1", "5", "14", "19", "26"]

  describe("ATK増加", () => {

    test.each([1, 2, 3, 4, 5])("発動あり-攻撃側(編成内)-cooldown x%d", (cnt) => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      // 編成
      const formation = [...dencoList.slice(0, cnt), "63"]
        .map(n => DencoManager.getDenco(context, n, 50))
      let tsumugi = formation[cnt]
      let offense = initUser(context, "とあるマスター", formation)
      offense = activateSkill(context, offense, ...Array(cnt + 1).fill(0).map((_, i) => i))
      // cooldownまで待つ
      context.clock = start + 1800 * 1000
      offense = refreshState(context, offense)

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
      expect(hasSkillTriggered(result.offense, tsumugi)).toBe(true)
      expect(result.attackPercent).toBe(4 * cnt)
    })

    test.each([1, 2, 3, 4, 5])("発動あり-攻撃側(アクセス)-cooldown x%d", (cnt) => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      // 編成
      const formation = ["63", ...dencoList.slice(0, cnt)]
        .map(n => DencoManager.getDenco(context, n, 50))
      let tsumugi = formation[0]
      let offense = initUser(context, "とあるマスター", formation)
      offense = activateSkill(context, offense, ...Array(cnt + 1).fill(0).map((_, i) => i))
      // cooldownまで待つ
      context.clock = start + 1800 * 1000
      offense = refreshState(context, offense)

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
      expect(hasSkillTriggered(result.offense, tsumugi)).toBe(true)
      expect(result.attackPercent).toBe(4 * cnt)
    })

    test("発動なし-攻撃側(編成内)-cooldownなし(idle, active)", () => {
      const context = initContext("test", "test", false)

      // 編成
      let seria = DencoManager.getDenco(context, "1", 50) // active: 1800 sec 
      let reika = DencoManager.getDenco(context, "5", 50) // active: 900 sec
      let fubu = DencoManager.getDenco(context, "14", 50) // active: 1800 sec
      let imura = DencoManager.getDenco(context, "19", 50) // active: 900 sec
      let hokone = DencoManager.getDenco(context, "26", 50) // active: 1200 sec
      let tsumugi = DencoManager.getDenco(context, "63", 50) // active: 2700 sec
      let offense = initUser(context, "とあるマスター", [seria, reika, fubu, imura, hokone, tsumugi])
      offense = activateSkill(context, offense, 0, 2, 5)
      // cooldownまで待たない

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
      expect(hasSkillTriggered(result.offense, tsumugi)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
  })

  describe("DEF増加", () => {

    test.each([1, 2, 3, 4, 5])("発動あり-守備側(編成内)-cooldown x%d", (cnt) => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      // 編成
      const formation = [...dencoList.slice(0, cnt), "63"]
        .map(n => DencoManager.getDenco(context, n, 50, 1))
      let tsumugi = formation[cnt]
      let defense = initUser(context, "とあるマスター", formation)
      defense = activateSkill(context, defense, ...Array(cnt + 1).fill(0).map((_, i) => i))
      // cooldownまで待つ
      context.clock = start + 1800 * 1000
      defense = refreshState(context, defense)

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
        station: formation[0].link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, tsumugi)).toBe(true)
      expect(result.defendPercent).toBe(4 * cnt)
    })

    test.each([1, 2, 3, 4, 5])("発動あり-守備側(被アクセス)-cooldown x%d", (cnt) => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      // 編成
      const formation = ["63", ...dencoList.slice(0, cnt)]
        .map(n => DencoManager.getDenco(context, n, 50, 1))
      let tsumugi = formation[0]
      let defense = initUser(context, "とあるマスター", formation)
      defense = activateSkill(context, defense, ...Array(cnt + 1).fill(0).map((_, i) => i))
      // cooldownまで待つ
      context.clock = start + 1800 * 1000
      defense = refreshState(context, defense)

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
        station: tsumugi.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, tsumugi)).toBe(true)
      expect(result.defendPercent).toBe(4 * cnt)
    })

    test("発動なし-守備側(編成内)-cooldownなし(idle, active)", () => {
      const context = initContext("test", "test", false)

      // 編成
      let seria = DencoManager.getDenco(context, "1", 50, 1) // active: 1800 sec 
      let reika = DencoManager.getDenco(context, "5", 50) // active: 900 sec
      let fubu = DencoManager.getDenco(context, "14", 50) // active: 1800 sec
      let imura = DencoManager.getDenco(context, "19", 50) // active: 900 sec
      let hokone = DencoManager.getDenco(context, "26", 50) // active: 1200 sec
      let tsumugi = DencoManager.getDenco(context, "63", 50) // active: 2700 sec
      let defense = initUser(context, "とあるマスター", [seria, reika, fubu, imura, hokone, tsumugi])
      defense = activateSkill(context, defense, 0, 1, 5)
      // cooldownまで待たない

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
        station: seria.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, tsumugi)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
  })
})