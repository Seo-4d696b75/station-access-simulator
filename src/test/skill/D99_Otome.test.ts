import assert from "assert"
import { getSkill, init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser, refreshState } from "../../core/user"
import { LocalDateType } from "../../core/user/property"
import "../../gen/matcher"

describe("おとめのスキル", () => {
  beforeAll(init)

  describe("経験値配布", () => {

    test.each([0, 1, 2, 5, 10, 20, 50, 70, 100, 200])("前日のアクセス数 %d", (cnt) => {
      const context = initContext("test", "test", false)
      let otome = DencoManager.getDenco(context, "99", 50)
      let iroha = DencoManager.getDenco(context, "10", 50)
      let offense = initUser(context, "とあるマスター", [iroha, otome])
      const callback = jest.fn((type: LocalDateType) => type === "yesterday" ? cnt : 1)
      offense.user.getDailyAccessCount = callback
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "とあるマスター２", [miroku])
      const config = {
        offense: {
          state: offense,
          carIndex: 0,
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: miroku.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", otome)).toBe(cnt > 0)
      let d = getAccessDenco(result, "offense")
      expect(d.exp.skill).toBe(
        cnt > 0
          ? Math.max(
            1, // 最低1 
            Math.floor(1450 * Math.pow(Math.min(cnt, 70) / 70, 2)),
          )
          : 0
      )
      expect(callback.mock.calls.length).toBe(1)
      expect(callback.mock.calls[0][0]).toBe("yesterday")
    })

    test("自身も対象", () => {
      const context = initContext("test", "test", false)
      let otome = DencoManager.getDenco(context, "99", 50)
      let offense = initUser(context, "とあるマスター", [otome])
      const callback = jest.fn((type: LocalDateType) => type === "yesterday" ? 10 : 1)
      offense.user.getDailyAccessCount = callback
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "とあるマスター２", [miroku])
      const config = {
        offense: {
          state: offense,
          carIndex: 0,
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: miroku.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", otome)).toBe(true)
      let d = getAccessDenco(result, "offense")
      expect(d.exp.skill).toBe(
        Math.floor(1450 * Math.pow(10 / 70, 2))
      )
    })
    test("足湯も対象", () => {
      const context = initContext("test", "test", false)
      let otome = DencoManager.getDenco(context, "99", 50)
      let iroha = DencoManager.getDenco(context, "10", 50)
      let offense = initUser(context, "とあるマスター", [iroha, otome])
      const callback = jest.fn((type: LocalDateType) => type === "yesterday" ? 10 : 1)
      offense.user.getDailyAccessCount = callback
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "とあるマスター２", [miroku])
      const config = {
        offense: {
          state: offense,
          carIndex: 0,
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        usePink: true,
        station: miroku.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", otome)).toBe(true)
      let d = getAccessDenco(result, "offense")
      expect(d.exp.skill).toBe(
        Math.floor(1450 * Math.pow(10 / 70, 2))
      )
    })
    test("不在も対象", () => {
      const context = initContext("test", "test", false)
      let otome = DencoManager.getDenco(context, "99", 50)
      let iroha = DencoManager.getDenco(context, "10", 50)
      let offense = initUser(context, "とあるマスター", [iroha, otome])
      const callback = jest.fn((type: LocalDateType) => type === "yesterday" ? 10 : 1)
      offense.user.getDailyAccessCount = callback
      let miroku = DencoManager.getDenco(context, "4", 50, 1)

      const config = {
        offense: {
          state: offense,
          carIndex: 0,
        },
        defense: undefined,
        station: miroku.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).toBeUndefined()
      expect(hasSkillTriggered(result, "offense", otome)).toBe(true)
      let d = getAccessDenco(result, "offense")
      expect(d.exp.skill).toBe(
        Math.floor(1450 * Math.pow(10 / 70, 2))
      )
    })
  })

  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let otome = DencoManager.getDenco(context, "99", 50)
    let siira = DencoManager.getDenco(context, "11", 50)
    let offense = initUser(context, "とあるマスター", [otome, siira])

    const callback = jest.fn((type: LocalDateType) => type === "yesterday" ? 10 : 1)
    offense.user.getDailyAccessCount = callback

    // autoタイプだけどunable => active即座に状態遷移
    // 初期化 => active => cooldown => (unable) => active
    let skill = getSkill(offense.formation[0])
    expect(skill.transitionType).toBe("auto")
    expect(skill.transition.state).toBe("active")


    // アクセス
    const start = context.currentTime
    context.clock = start
    context.random.mode = "ignore"

    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let defense = initUser(context, "とあるマスター２", [miroku])
    let config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: miroku.link[0],
    }
    const result = startAccess(context, config)
    expect(hasSkillTriggered(result, "offense", otome)).toBe(true)

    // イベント記録確認（表示なし）
    expect(result.offense.event.length).toBe(1)
    expect(result.offense.event[0].type).toBe("access")
    // cooldown
    let d = result.offense.formation[0]
    skill = getSkill(d)
    assert(skill.transition.state === "cooldown")
    expect(skill.transition.data.cooldownTimeout).toBe(start + 3600 * 1000)

    // cooldown終了 > active
    offense = result.offense
    context.clock = start + 3600 * 1000
    offense = refreshState(context, offense)
    skill = getSkill(offense.formation[0])
    expect(skill.transition.state).toBe("active")
  })

})