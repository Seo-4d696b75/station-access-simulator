import { activateSkill, init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"

describe("まぜのスキル", () => {
  beforeAll(init)

  describe("自身の固定ダメージ軽減", () => {
    test.each([1, 3, 5, 10, 30, 50, 70, 100, 200])("発動あり-守備側(被アクセス)-%d駅", (count) => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let seria = DencoManager.getDenco(context, "1", 50)
      let maze = DencoManager.getDenco(context, "67", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      charlotte.ap = 50
      let defense = initUser(context, "とあるマスター", [maze, seria])
      defense.user.daily = {
        accessStationCount: count
      }
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
        station: maze.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, maze)).toBe(true)
      expect(result.defendPercent).toBe(0)
      const damageOther = count >= 26 ? 20 : 0
      const damageSelf = 1.4 * Math.min(count, 70) + damageOther
      expect(result.damageFixed).toBe(-damageSelf)
      let d = getAccessDenco(result, "defense")
      expect(d.damage?.value).toBe(Math.max(charlotte.ap - damageSelf, 0))
    })
    test("発動あり-守備側(被アクセス)-10駅-確率ブースト", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore" // 確率ブーストで100%超えるため確定発動扱いになる

      let hiiru = DencoManager.getDenco(context, "34", 50)
      let maze = DencoManager.getDenco(context, "67", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [maze, hiiru])
      defense.user.daily = {
        accessStationCount: 10
      }
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
        station: maze.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, maze)).toBe(true)
      expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
      expect(result.defendPercent).toBe(0)
      expect(result.damageFixed).toBe(-14)
    })
    test("発動なし-守備側(被アクセス)-10駅-確率", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"

      let seria = DencoManager.getDenco(context, "1", 50)
      let maze = DencoManager.getDenco(context, "67", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [maze, seria])
      defense.user.daily = {
        accessStationCount: 10
      }
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
        station: maze.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, maze)).toBe(false)
      expect(result.defendPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
    })
    test("発動なし-守備側(編成内)-10駅", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let maze = DencoManager.getDenco(context, "67", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [maze, seria])
      defense.user.daily = {
        accessStationCount: 10
      }
      let offense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 1
        },
        station: maze.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, maze)).toBe(false)
      expect(result.defendPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
    })
  })

  describe("編成内の固定ダメージ軽減", () => {

    test.each([1, 3, 5, 10, 25, 26, 27, 30, 50, 100])("守備側(編成内)-%d駅", (count) => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let maze = DencoManager.getDenco(context, "67", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      charlotte.ap = 50
      let defense = initUser(context, "とあるマスター", [seria, maze])
      defense.user.daily = {
        accessStationCount: count
      }
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
      expect(hasSkillTriggered(result.defense, maze)).toBe(count >= 26)
      expect(result.defendPercent).toBe(0)
      const damageOther = count >= 26 ? -20 : 0
      expect(result.damageFixed).toBe(damageOther)
      let d = getAccessDenco(result, "defense")
      expect(d.damage?.value).toBe(charlotte.ap + damageOther)
    })
  })

  describe("スキル無効化の影響-守備側-30駅", () => {
    test("発動あり-守備側(編成内)-無効化なし", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let maze = DencoManager.getDenco(context, "67", 50, 1)
      let ren = DencoManager.getDenco(context, "22", 50)
      let defense = initUser(context, "とあるマスター", [seria, maze])
      defense.user.daily = {
        accessStationCount: 30
      }
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
      expect(hasSkillTriggered(result.defense, maze)).toBe(true)
      expect(result.defendPercent).toBe(0)
      expect(result.damageFixed).toBe(-20)
    })
    test("発動なし-守備側(被アクセス)-無効化", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let maze = DencoManager.getDenco(context, "67", 50, 1)
      let ren = DencoManager.getDenco(context, "22", 50)
      let defense = initUser(context, "とあるマスター", [maze, seria])
      defense.user.daily = {
        accessStationCount: 30
      }
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
        station: maze.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, ren)).toBe(true)
      expect(hasSkillTriggered(result.defense, maze)).toBe(false)
      expect(result.defendPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
    })
  })
})