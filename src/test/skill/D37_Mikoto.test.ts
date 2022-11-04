import { activateSkill, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import { testAlwaysSkill } from "../skillState"

describe("みことのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "37",
    name: "mikoto"
  })

  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [mikoto, seria])
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-攻撃側(アクセス)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 50)
    let mikoto = DencoManager.getDenco(context, "37", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [mikoto, luna])
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
    expect(hasSkillTriggered(result.offense, mikoto)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-攻撃側(編成内)-アタッカー", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let saya = DencoManager.getDenco(context, "8", 50)
    let mikoto = DencoManager.getDenco(context, "37", 50,)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saya, mikoto])
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
    expect(hasSkillTriggered(result.offense, mikoto)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動あり-攻撃側(編成内)-ディフェンダー", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 50)
    let mikoto = DencoManager.getDenco(context, "37", 50,)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [luna, mikoto])
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
    expect(hasSkillTriggered(result.offense, mikoto)).toBe(true)
    expect(result.attackPercent).toBe(12)
  })
  test("発動なし（確率）-攻撃側(編成内)-ディフェンダー", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let luna = DencoManager.getDenco(context, "3", 50)
    let mikoto = DencoManager.getDenco(context, "37", 50,)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [luna, mikoto])
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
    expect(hasSkillTriggered(result.offense, mikoto)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動あり（確率ブースト）-攻撃側(編成内)-ディフェンダー", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 50)
    let mikoto = DencoManager.getDenco(context, "37", 50,)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [luna, mikoto, hiiru])
    offense = activateSkill(context, offense, 2)
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
    expect(hasSkillTriggered(result.offense, mikoto)).toBe(true)
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
    expect(result.attackPercent).toBe(12)
  })
})