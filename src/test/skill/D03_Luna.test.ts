import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { initContext } from "../../core/context"
import { initUser } from "../../core/user"
import { activateSkill, disactivateSkill, getSkill, refreshSkillState } from "../../core/skill"
import { getAccessDenco, getDefense, startAccess } from "../../core/access"
import moment from "moment-timezone"

describe("ルナのスキル", () => {
  test("setup", async () => {
    await StationManager.load()
    await SkillManager.load()
    await DencoManager.load()
    expect(StationManager.data.length).toBeGreaterThan(0)
    expect(SkillManager.map.size).toBeGreaterThan(0)
    expect(DencoManager.data.size).toBeGreaterThan(0)
  })
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let luna = DencoManager.getDenco(context, "3", 50)
    expect(luna.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [luna])
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    state = refreshSkillState(context, state)
    luna = state.formation[0]
    let skill = getSkill(luna)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")

    expect(() => activateSkill(context, { ...state, carIndex: 0 })).toThrowError()
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 })).toThrowError()


    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    state = refreshSkillState(context, state)
    luna = state.formation[0]
    skill = getSkill(luna)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")
  })
  test("発動なし-フットバース使用", () => {
    const context = initContext("test", "test", false)
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: luna.link[0],
      usePink: true,
    }
    const result = startAccess(context, config)
    const access = result.access
    expect(access.pinkItemSet).toBe(true)
    expect(access.pinkItemUsed).toBe(true)
    expect(access.pinkMode).toBe(true)
    expect(access.defense?.triggeredSkills.length).toBe(0)
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    let accessLuna = getAccessDenco(access, "defense")
    expect(accessLuna.reboot).toBe(false)
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [luna])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    expect(access.pinkMode).toBe(false)
    expect(access.offense.triggeredSkills.length).toBe(0)
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
    let accessReika = getAccessDenco(access, "defense")
    expect(accessReika.reboot).toBe(false)
    expect(accessReika.hpBefore).toBe(192)
    expect(accessReika.hpAfter).toBe(36)
    expect(accessReika.damage?.value).toBe(156)
  })
  test("発動あり-夜", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    expect(access.pinkMode).toBe(false)
    expect(access.defense?.triggeredSkills.length).toBe(1)
    let trigger = getDefense(access).triggeredSkills[0]
    expect(trigger.numbering).toBe("3")
    expect(trigger.name).toBe("luna")
    expect(trigger.step).toBe("damage_common")
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
    expect(access.defendPercent).toBe(25)
    let accessLuna = getAccessDenco(access, "defense")
    expect(accessLuna.reboot).toBe(false)
    expect(accessLuna.hpBefore).toBe(240)
    expect(accessLuna.hpAfter).toBe(90)
    expect(accessLuna.damage?.value).toBe(150)
  })
  test("発動あり-昼", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    expect(access.pinkMode).toBe(false)
    expect(access.defense?.triggeredSkills.length).toBe(1)
    let trigger = getDefense(access).triggeredSkills[0]
    expect(trigger.numbering).toBe("3")
    expect(trigger.name).toBe("luna")
    expect(trigger.step).toBe("damage_common")
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    expect(access.defendPercent).toBe(-30)
    let accessLuna = getAccessDenco(access, "defense")
    expect(accessLuna.reboot).toBe(true)
    expect(accessLuna.hpBefore).toBe(240)
    expect(accessLuna.hpAfter).toBe(0)
    expect(accessLuna.damage?.value).toBe(260)
  })
})