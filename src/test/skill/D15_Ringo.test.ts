import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getAccessDenco, getSkill, hasSkillTriggered, init, initContext, initUser, refreshState, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"

describe("りんごのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let ringo = DencoManager.getDenco(context, "15", 50)
    expect(ringo.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [ringo])
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    state = refreshState(context, state)
    ringo = state.formation[0]
    let skill = getSkill(ringo)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")

    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => deactivateSkill(context, state, 0)).toThrowError()


    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    state = refreshState(context, state)
    ringo = state.formation[0]
    skill = getSkill(ringo)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")
  })
  test("発動なし-フットバース使用", () => {
    const context = initContext("test", "test", false)
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let ringo = DencoManager.getDenco(context, "15", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [ringo])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: luna.link[0],
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.pinkItemSet).toBe(true)
    expect(result.pinkItemUsed).toBe(true)
    expect(result.pinkMode).toBe(true)
    expect(hasSkillTriggered(result.offense, ringo)).toBe(false)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
  })
  test("発動なし-昼-守備側", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let ringo = DencoManager.getDenco(context, "15", 50, 1)
    let defense = initUser(context, "とあるマスター", [ringo])
    let offense = initUser(context, "とあるマスター２", [luna])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: ringo.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, ringo)).toBe(false)
    expect(hasSkillTriggered(result.offense, luna)).toBe(false)
    expect(result.damageBase?.variable).toBe(156)
    let accessRingo = getAccessDenco(result, "defense")
    expect(accessRingo.reboot).toBe(true)
    expect(accessRingo.hpBefore).toBe(144)
    expect(accessRingo.hpAfter).toBe(0)
    expect(accessRingo.damage?.value).toBe(156)
    expect(accessRingo.damage?.attr).toBe(true)
  })
  test("発動なし-攻撃側編成内", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let ringo = DencoManager.getDenco(context, "15", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [reika, ringo])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(-30)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.offense, ringo)).toBe(false)
    expect(hasSkillTriggered(result.defense, luna)).toBe(true)
    expect(result.damageBase?.variable).toBe(260)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(true)
    expect(accessLuna.hpBefore).toBe(240)
    expect(accessLuna.hpAfter).toBe(0)
    expect(accessLuna.damage?.value).toBe(260)
    expect(accessLuna.damage?.attr).toBe(false)
  })
  test("発動あり-夜-守備側", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let ringo = DencoManager.getDenco(context, "15", 50, 1)
    let defense = initUser(context, "とあるマスター", [ringo])
    let offense = initUser(context, "とあるマスター２", [luna])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: ringo.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(hasSkillTriggered(result.defense, ringo)).toBe(true)
    expect(hasSkillTriggered(result.offense, luna)).toBe(false)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(-30)
    expect(result.attackPercent).toBe(0)
    let accessRingo = getAccessDenco(result, "defense")
    expect(accessRingo.reboot).toBe(true)
    expect(accessRingo.hpBefore).toBe(144)
    expect(accessRingo.hpAfter).toBe(0)
    expect(accessRingo.damage?.value).toBe(202)
    expect(accessRingo.damage?.attr).toBe(true)
  })
  test("発動あり-昼-攻撃側", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let ringo = DencoManager.getDenco(context, "15", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [ringo])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(hasSkillTriggered(result.offense, ringo)).toBe(true)
    expect(hasSkillTriggered(result.defense, luna)).toBe(true)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(-30)
    expect(result.attackPercent).toBe(23)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(true)
    expect(accessLuna.hpBefore).toBe(240)
    expect(accessLuna.hpAfter).toBe(0)
    expect(accessLuna.damage?.value).toBe(306)
    expect(accessLuna.damage?.attr).toBe(false)
  })
  test("発動なし-夜-攻撃側", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let ringo = DencoManager.getDenco(context, "15", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [ringo])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(hasSkillTriggered(result.offense, ringo)).toBe(false)
    expect(hasSkillTriggered(result.defense, luna)).toBe(true)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(25)
    expect(result.attackPercent).toBe(0)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(false)
    expect(accessLuna.hpBefore).toBe(240)
    expect(accessLuna.hpAfter).toBe(90)
    expect(accessLuna.damage?.value).toBe(150)
    expect(accessLuna.damage?.attr).toBe(false)
  })
})