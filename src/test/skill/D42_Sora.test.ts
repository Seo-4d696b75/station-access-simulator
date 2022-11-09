import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getSkill, hasSkillTriggered, init, initContext, initUser, isSkillActive, refreshState, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import StationManager from "../../core/stationManager"

describe("そらのスキル", () => {
  beforeAll(init)

  test("スキル状態", () => {

    const context = initContext("test", "test", false)
    let sora = DencoManager.getDenco(context, "42", 50)
    expect(sora.name).toBe("sora")
    expect(sora.skill.type).toBe("possess")
    let state = initUser(context, "master", [sora])

    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => deactivateSkill(context, state, 0)).toThrowError()

    // 平日昼間
    context.clock = moment('2022-11-02T12:00:00+0900').valueOf()
    state = refreshState(context, state)
    sora = state.formation[0]
    let skill = getSkill(sora)
    expect(skill.transition.type).toBe("auto-condition")
    expect(skill.transition.state).toBe("active")
    expect(() => deactivateSkill(context, state, 0)).toThrowError()


    // 平日夜間
    context.clock = moment('2022-11-02T18:00:00+0900').valueOf()
    state = refreshState(context, state)
    sora = state.formation[0]
    skill = getSkill(sora)
    expect(skill.transition.type).toBe("auto-condition")
    expect(skill.transition.state).toBe("unable")
    expect(() => activateSkill(context, state, 0)).toThrowError()

    // 土曜昼間
    context.clock = moment('2022-11-05T12:00:00+0900').valueOf()
    state = refreshState(context, state)
    sora = state.formation[0]
    skill = getSkill(sora)
    expect(skill.transition.type).toBe("auto-condition")
    expect(skill.transition.state).toBe("unable")
    expect(() => activateSkill(context, state, 0)).toThrowError()


    // 祝日昼間（文化の日）
    context.clock = moment('2022-11-03T12:00:00+0900').valueOf()
    state = refreshState(context, state)
    sora = state.formation[0]
    skill = getSkill(sora)
    expect(skill.transition.type).toBe("auto-condition")
    expect(skill.transition.state).toBe("unable")
    expect(() => activateSkill(context, state, 0)).toThrowError()
  })

  test("発動あり-攻撃側(アクセス)", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-11-02T10:00:00+0900').valueOf()
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let sora = DencoManager.getDenco(context, "42", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [sora, seria])
    expect(isSkillActive(offense.formation[0].skill)).toBe(true)
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
    expect(hasSkillTriggered(result.offense, sora)).toBe(true)
    expect(result.attackPercent).toBe(40)
  })
  test("発動なし-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-11-02T10:00:00+0900').valueOf()
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let sora = DencoManager.getDenco(context, "42", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [sora, seria])
    expect(isSkillActive(offense.formation[0].skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
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
    expect(hasSkillTriggered(result.offense, sora)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃側(アクセス)-確率", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-11-02T10:00:00+0900').valueOf()
    context.random.mode = "ignore"
    let seria = DencoManager.getDenco(context, "1", 50)
    let sora = DencoManager.getDenco(context, "42", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [sora, seria])
    expect(isSkillActive(offense.formation[0].skill)).toBe(true)
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
    expect(hasSkillTriggered(result.offense, sora)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃側(アクセス)-時間外", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-11-02T17:00:00+0900').valueOf()
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let sora = DencoManager.getDenco(context, "42", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [sora, seria])
    expect(isSkillActive(offense.formation[0].skill)).toBe(false)
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
    expect(hasSkillTriggered(result.offense, sora)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動あり-攻撃側(アクセス)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    context.clock = moment('2022-11-02T16:59:59+0900').valueOf()
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let sora = DencoManager.getDenco(context, "42", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [sora, hiiru])
    offense = activateSkill(context, offense, 1)
    expect(isSkillActive(offense.formation[0].skill)).toBe(true)
    expect(isSkillActive(offense.formation[1].skill)).toBe(true)
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
    expect(hasSkillTriggered(result.offense, sora)).toBe(true)
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
    expect(result.attackPercent).toBe(40)
  })

  test("発動なし-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    context.clock = moment('2022-11-02T16:59:59+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50)
    let sora = DencoManager.getDenco(context, "42", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, sora])
    expect(isSkillActive(offense.formation[1].skill)).toBe(true)
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
    expect(hasSkillTriggered(result.offense, sora)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    context.clock = moment('2022-11-02T16:59:59+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50)
    let sora = DencoManager.getDenco(context, "42", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [sora, seria])
    expect(isSkillActive(defense.formation[0].skill)).toBe(true)
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
      station: sora.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, sora)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃側(アクセス)-相手無し", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-11-02T10:00:00+0900').valueOf()
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let sora = DencoManager.getDenco(context, "42", 50)
    let offense = initUser(context, "とあるマスター", [sora, seria])
    expect(isSkillActive(offense.formation[0].skill)).toBe(true)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: StationManager.getRandomStation(context, 1)[0],
    }
    const result = startAccess(context, config)
    expect(hasSkillTriggered(result.offense, sora)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
})