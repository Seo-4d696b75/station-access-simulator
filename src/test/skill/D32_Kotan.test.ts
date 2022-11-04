import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getSkill, hasSkillTriggered, init, initContext, initUser, isSkillActive, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import StationManager from "../../core/stationManager"

describe("コタンのスキル", () => {
  beforeAll(init)


  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let kotan = DencoManager.getDenco(context, "32", 50)
    expect(kotan.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [kotan])
    const now = moment().valueOf()
    context.clock = now
    kotan = defense.formation[0]
    expect(kotan.name).toBe("kotan")
    let skill = getSkill(kotan)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")
    expect(() => activateSkill(context, defense, 0)).toThrowError()
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
  })

  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let kotan = DencoManager.getDenco(context, "32", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [kotan, seria])
    defense.user.daily = {
      accessStationCount: 20
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
      station: kotan.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, kotan)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, kotan])
    offense.user.daily = {
      accessStationCount: 20
    }
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
    expect(hasSkillTriggered(result.offense, kotan)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動あり-攻撃側(アクセス)-相手なし", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let offense = initUser(context, "とあるマスター", [kotan, seria])
    offense.user.daily = {
      accessStationCount: 20
    }
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: StationManager.getRandomStation(context, 1)[0]
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(hasSkillTriggered(result.offense, kotan)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動あり-攻撃側(アクセス)-20駅", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [kotan, seria])
    offense.user.daily = {
      accessStationCount: 20
    }
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
    expect(hasSkillTriggered(result.offense, kotan)).toBe(true)
    const atk = Math.floor(50 * 20 / 50)
    expect(result.attackPercent).toBe(atk)
  })
  test("発動あり-攻撃側(アクセス)-50駅", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [kotan, seria])
    offense.user.daily = {
      accessStationCount: 50
    }
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
    expect(hasSkillTriggered(result.offense, kotan)).toBe(true)
    expect(result.attackPercent).toBe(50)
  })
  test("発動あり-攻撃側(アクセス)-100駅", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [kotan, seria])
    offense.user.daily = {
      accessStationCount: 100
    }
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
    expect(hasSkillTriggered(result.offense, kotan)).toBe(true)
    expect(result.attackPercent).toBe(50)
  })
  test("発動あり-攻撃側(アクセス)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [kotan, hiiru])
    offense.user.daily = {
      accessStationCount: 20
    }
    offense = activateSkill(context, offense, 1)
    hiiru = offense.formation[1]
    expect(isSkillActive(hiiru.skill)).toBe(true)
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
    expect(hasSkillTriggered(result.offense, kotan)).toBe(true)
    // 確率補正は効かない
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(false)
    expect(result.attackPercent).toBeGreaterThan(0)
  })
})