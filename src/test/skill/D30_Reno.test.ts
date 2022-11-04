import moment from "moment-timezone"
import { init, initContext, initUser } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import DencoManager from "../../core/dencoManager"
import { testAlwaysSkill } from "../skillState"

describe("レーノのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "30",
    name: "reno"
  })

  test("発動なし-攻撃側(アクセス)-昼", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50)
    let reno = DencoManager.getDenco(context, "30", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reno, seria])
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
    expect(hasSkillTriggered(result.offense, reno)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-攻撃側(編成内)-夜", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T00:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let reno = DencoManager.getDenco(context, "30", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let offense = initUser(context, "とあるマスター", [seria, reno])
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, reno)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動あり-攻撃側(アクセス)-夜", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T00:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50)
    let reno = DencoManager.getDenco(context, "30", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reno, seria])
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
    expect(hasSkillTriggered(result.offense, reno)).toBe(true)
    expect(result.attackPercent).toBe(45)
  })

  test("発動なし-守備側(被アクセス)-夜", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T00:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50)
    let reno = DencoManager.getDenco(context, "30", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reno, seria])
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
      station: reno.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, reno)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })

  test("発動なし-守備側(編成内)-昼", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let reno = DencoManager.getDenco(context, "30", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, reno])
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
    expect(hasSkillTriggered(result.defense, reno)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })

  test("発動あり-守備側(被アクセス)-昼", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50)
    let reno = DencoManager.getDenco(context, "30", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reno, seria])
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
      station: reno.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, reno)).toBe(true)
    expect(result.defendPercent).toBe(-30)
  })
})