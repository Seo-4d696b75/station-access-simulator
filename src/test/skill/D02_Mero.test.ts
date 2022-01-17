import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { initContext } from "../../core/context"
import { initUser } from "../../core/user"
import { activateSkill, disactivateSkill, refreshSkillState } from "../../core/skill"
import { getSkill } from "../../core/denco"
import { getAccessDenco, startAccess } from "../../core/access"

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
    expect(mero.skillHolder.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [mero])
    const now = Date.now()
    context.clock = now
    state = refreshSkillState(context, state)
    mero = state.formation[0]
    let skill = getSkill(mero)
    expect(skill.transitionType).toBe("always")
    expect(skill.state.type).toBe("active")

    expect(() => activateSkill(context, { ...state, carIndex: 0 })).toThrowError()
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 })).toThrowError()

    context.clock = now + 600 * 1000
    state = refreshSkillState(context, state)
    mero = state.formation[0]
    skill = getSkill(mero)
    expect(skill.transitionType).toBe("always")
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
      expect(access.defense.damage?.value).toBe(200)
      let d = getAccessDenco(access, "defense")
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
      expect(access.defense.damage).toBeUndefined()
      let accessReika = getAccessDenco(access, "defense")
      expect(accessReika.reboot).toBe(false)
    }
  })
})