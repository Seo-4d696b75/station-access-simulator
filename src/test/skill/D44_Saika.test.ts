import moment from "moment-timezone"
import { deactivateSkill, getSkill, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"

describe("さいかのスキル", () => {
  beforeAll(init)


  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let saika = DencoManager.getDenco(context, "44", 50)
    expect(saika.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [saika])
    const now = moment().valueOf()
    context.clock = now
    saika = defense.formation[0]
    expect(saika.name).toBe("saika")
    let skill = getSkill(saika)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
  })

  test("発動なし-攻撃側(アクセス)-3km未満", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    offense.user.daily = {
      distance: 2.9
    }
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
    expect(hasSkillTriggered(result.offense, saika)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃側(アクセス)-相手不在", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    offense.user.daily = {
      distance: 100
    }
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(hasSkillTriggered(result.offense, saika)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    offense.user.daily = {
      distance: 100
    }
    const config = {
      offense: {
        state: offense,
        carIndex: 1
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, saika)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動あり-攻撃側(アクセス)-10km", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    offense.user.daily = {
      distance: 10
    }
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
    expect(hasSkillTriggered(result.offense, saika)).toBe(true)
    expect(result.attackPercent).toBe(0.28 * 10)
  })
  test("発動あり-攻撃側(アクセス)-100km", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    offense.user.daily = {
      distance: 100
    }
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
    expect(hasSkillTriggered(result.offense, saika)).toBe(true)
    expect(result.attackPercent).toBe(0.28 * 100)
  })
  test("発動あり-攻撃側(アクセス)-200km", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    offense.user.daily = {
      distance: 200
    }
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
    expect(hasSkillTriggered(result.offense, saika)).toBe(true)
    expect(result.attackPercent).toBe(0.28 * 100 + 0.1 * 100)
  })
  test("発動あり-攻撃側(アクセス)-360km", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    offense.user.daily = {
      distance: 360
    }
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
    expect(hasSkillTriggered(result.offense, saika)).toBe(true)
    expect(result.attackPercent).toBe(0.28 * 100 + 0.1 * 260)
  })
  test("発動あり-攻撃側(アクセス)-400km", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    offense.user.daily = {
      distance: 400
    }
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
    expect(hasSkillTriggered(result.offense, saika)).toBe(true)
    expect(result.attackPercent).toBe(0.28 * 100 + 0.1 * 260)
  })
})
