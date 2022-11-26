import moment from "moment-timezone"
import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../skillState"


describe("ららのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "56",
    name: "rara",
    time: [
      moment('2022-01-01T12:00:00+0900').valueOf(),
      moment('2022-01-01T23:00:00+0900').valueOf()
    ]
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    let rara = DencoManager.getDenco(context, "56", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [rara])
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
    expect(hasSkillTriggered(result.defense, rara)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動あり-守備側(被アクセス)-昼", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50)
    let rara = DencoManager.getDenco(context, "56", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [rara, seria])
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
      station: rara.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, rara)).toBe(true)
    expect(result.defendPercent).toBe(25)
  })
  test("発動なし-守備側(編成内)-昼", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let rara = DencoManager.getDenco(context, "56", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, rara])
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
    expect(hasSkillTriggered(result.defense, rara)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動あり-守備側(被アクセス)-夜", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T20:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50)
    let rara = DencoManager.getDenco(context, "56", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [rara, seria])
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
      station: rara.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, rara)).toBe(true)
    expect(result.defendPercent).toBe(-30)
  })
  test("発動なし-守備側(編成内)-夜", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T20:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let rara = DencoManager.getDenco(context, "56", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, rara])
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
    expect(hasSkillTriggered(result.defense, rara)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })

})