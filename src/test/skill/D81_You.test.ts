import { DencoAttribute, init } from "../.."
import { AccessResult, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { NewStationType } from "../../core/user/property"
import "../../gen/matcher"
import { testAlwaysSkill } from "../tool/skillState"

describe("なるのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "81",
    name: "you",
  })

  describe("経験値配布（今日の新駅なし）", () => {

    test("isNewStation未定義", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let you = DencoManager.getDenco(context, "81", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let moe = DencoManager.getDenco(context, "9", 10, 1)
      let offense = initUser(context, "とあるマスター", [reika, you, miroku, siira])
      let defense = initUser(context, "とあるマスター２", [moe])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: moe.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkSuccess).toBe(true)
      expect(hasSkillTriggered(result.offense, you)).toBe(true)
      checkEXP(result, 90)
    })
    test("isNewStation定義あり", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let you = DencoManager.getDenco(context, "81", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let moe = DencoManager.getDenco(context, "9", 10, 1)
      let offense = initUser(context, "とあるマスター", [reika, you, miroku, siira])
      const predicate = jest.fn((_) => NewStationType.None)
      offense.user.history = {
        isNewStation: predicate
      }
      let defense = initUser(context, "とあるマスター２", [moe])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: moe.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkSuccess).toBe(true)
      expect(hasSkillTriggered(result.offense, you)).toBe(true)
      checkEXP(result, 90)
      expect(predicate.mock.calls.length).toBe(1)
      expect(predicate.mock.calls[0][0]).toMatchStation(moe.link[0])
    })
  })

  test.each([
    NewStationType.Daily,
    NewStationType.Monthly,
    NewStationType.New,
  ])("経験値配布-新駅タイプ:%d", (type) => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let you = DencoManager.getDenco(context, "81", 50)
    let miroku = DencoManager.getDenco(context, "4", 50)
    let siira = DencoManager.getDenco(context, "11", 50)
    let moe = DencoManager.getDenco(context, "9", 10, 1)
    let offense = initUser(context, "とあるマスター", [reika, you, miroku, siira])
    const predicate = jest.fn((_) => type)
    offense.user.history = {
      isNewStation: predicate
    }
    let defense = initUser(context, "とあるマスター２", [moe])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: moe.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(result.linkSuccess).toBe(true)
    expect(hasSkillTriggered(result.offense, you)).toBe(true)
    checkEXP(result, 90 + 190)
    expect(predicate.mock.calls.length).toBe(1)
    expect(predicate.mock.calls[0][0]).toMatchStation(moe.link[0])
  })

  describe("発動なし", () => {
    test("足湯", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let you = DencoManager.getDenco(context, "81", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let moe = DencoManager.getDenco(context, "9", 10, 1)
      let offense = initUser(context, "とあるマスター", [reika, you, miroku, siira])
      const predicate = jest.fn((_) => NewStationType.Daily)
      offense.user.history = {
        isNewStation: predicate
      }
      let defense = initUser(context, "とあるマスター２", [moe])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: moe.link[0],
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkSuccess).toBe(true)
      expect(result.pinkMode).toBe(true)
      expect(hasSkillTriggered(result.offense, you)).toBe(false)
      checkEXP(result, 0)
      expect(predicate.mock.calls.length).toBe(0)
    })
    test("リンク失敗", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let you = DencoManager.getDenco(context, "81", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let moe = DencoManager.getDenco(context, "9", 80, 1)
      let offense = initUser(context, "とあるマスター", [reika, you, miroku, siira])
      const predicate = jest.fn((_) => NewStationType.Daily)
      offense.user.history = {
        isNewStation: predicate
      }
      let defense = initUser(context, "とあるマスター２", [moe])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: moe.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkSuccess).toBe(false)
      expect(hasSkillTriggered(result.offense, you)).toBe(false)
      checkEXP(result, 0)
      expect(predicate.mock.calls.length).toBe(0)
    })

    test.each(["eco", "cool", "flat"])("heat以外 %s", (attr) => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      reika.attr = attr as DencoAttribute
      let you = DencoManager.getDenco(context, "81", 50)
      let miroku = DencoManager.getDenco(context, "4", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let moe = DencoManager.getDenco(context, "9", 10, 1)
      let offense = initUser(context, "とあるマスター", [reika, you, miroku, siira])
      const predicate = jest.fn((_) => NewStationType.Daily)
      offense.user.history = {
        isNewStation: predicate
      }
      let defense = initUser(context, "とあるマスター２", [moe])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: moe.link[0],
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkSuccess).toBe(true)
      expect(hasSkillTriggered(result.offense, you)).toBe(false)
      checkEXP(result, 0)
      expect(predicate.mock.calls.length).toBe(0)
    })
  })
})

function checkEXP(result: AccessResult, exp: number) {
  const state = result.offense
  state.formation.forEach(d => {
    if (d.carIndex === state.carIndex) {
      expect(d.exp.access.accessBonus).toBe(100)
      expect(d.exp.access.damageBonus).toBe(result.damageBase?.variable ?? 0)
      expect(d.exp.access.linkBonus).toBe(result.linkSuccess ? 100 : 0)
      expect(d.exp.link).toBe(0)
      expect(d.exp.skill).toBe(exp)
      expect(d.exp.total).toBe(d.exp.access.total + exp)
    } else {
      expect(d.exp.access.total).toBe(0)
      expect(d.exp.link).toBe(0)
      expect(d.exp.skill).toBe(exp)
      expect(d.exp.total).toBe(exp)
    }
    expect(d.currentExp).toBe(d.exp.total)
  })
}