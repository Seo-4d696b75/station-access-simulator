import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { initContext } from "../../core/context"
import { initUser } from "../../core/user"
import { activateSkill, disactivateSkill, Skill, refreshSkillState } from "../../core/skill"
import { getAccessDenco, startAccess } from "../../core/access"
import moment from "moment-timezone"
import { getSkill } from "../.."

describe("メロのスキル", () => {
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
    let mero = DencoManager.getDenco(context, "2", 50)
    expect(mero.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [mero])
    const now = moment().valueOf()
    context.clock = now
    state = refreshSkillState(context, state)
    mero = state.formation[0]
    let skill = getSkill(mero)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")

    expect(() => activateSkill(context, { ...state, carIndex: 0 })).toThrowError()
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 })).toThrowError()

    context.clock = now + 600 * 1000
    state = refreshSkillState(context, state)
    mero = state.formation[0]
    skill = getSkill(mero)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")
  })
  test("発動なし-フットバース使用", () => {
    const context = initContext("test", "test", false)
    let mero = DencoManager.getDenco(context, "2", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [mero])
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
      usePink: true,
    }
    const result = startAccess(context, config)
    const access = result.access
    expect(access.pinkItemSet).toBe(true)
    expect(access.pinkItemUsed).toBe(true)
    expect(access.pinkMode).toBe(true)
    expect(access.offense.triggeredSkills.length).toBe(0)
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    let accessReika = getAccessDenco(access, "defense")
    expect(accessReika.reboot).toBe(false)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let mero = DencoManager.getDenco(context, "2", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [mero])
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
    expect(access.pinkItemSet).toBe(false)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.pinkMode).toBe(false)
    expect(access.offense.triggeredSkills.length).toBe(0)
    if (access.defense) {
      let d = getAccessDenco(access, "defense")
      expect(d.damage?.value).toBe(200)
      expect(d.hpBefore).toBe(192)
      expect(d.hpAfter).toBe(0)
      expect(d.reboot).toBe(true)
    }
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mero = DencoManager.getDenco(context, "2", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [mero])
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
    expect(access.pinkItemSet).toBe(false)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.pinkMode).toBe(true)
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    expect(access.offense.triggeredSkills.length).toBe(1)
    let trigger = access.offense.triggeredSkills[0]
    expect(trigger.step).toBe("pink_check")
    expect(trigger.numbering).toBe("2")
    expect(trigger.name).toBe("mero")
    if (access.defense) {
      let accessReika = getAccessDenco(access, "defense")
      expect(accessReika.reboot).toBe(false)
      expect(accessReika.damage).toBeUndefined()
    }
  })
  test("発動あり-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mero = DencoManager.getDenco(context, "2", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [mero, hiiru])
    offense = activateSkill(context, { ...offense, carIndex: 1 })
    hiiru = offense.formation[1]
    let skill = getSkill(hiiru)
    expect(skill.state.type).toBe("active")
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
    expect(access.pinkItemSet).toBe(false)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.pinkMode).toBe(true)
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    expect(access.offense.triggeredSkills.length).toBe(1)
    // メロ本人 ひいるの確率ブーストは乗らない
    let trigger = access.offense.triggeredSkills[0]
    expect(trigger.step).toBe("pink_check")
    expect(trigger.numbering).toBe("2")
    expect(trigger.name).toBe("mero")
    if (access.defense) {
      let accessReika = getAccessDenco(access, "defense")
      expect(accessReika.reboot).toBe(false)
      expect(accessReika.damage).toBeUndefined()
    }
  })
})