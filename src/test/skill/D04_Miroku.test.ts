import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { initContext } from "../../core/context"
import { initUser } from "../../core/user"
import { activateSkill, disactivateSkill, refreshSkillState } from "../../core/skill"
import { getSkill } from "../../core/denco"
import { getAccessDenco, getDefense, hasSkillTriggered, startAccess } from "../../core/access"

describe("みろくのスキル", () => {
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
    let miroku = DencoManager.getDenco(context, "4", 50)
    expect(miroku.skillHolder.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [miroku])
    context.clock = Date.now()
    state = refreshSkillState(context, state)
    miroku = state.formation[0]
    let skill = getSkill(miroku)
    expect(skill.transitionType).toBe("always")
    expect(skill.state.type).toBe("active")

    expect(() => activateSkill(context, { ...state, carIndex: 0 })).toThrowError()
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 })).toThrowError()

    
    context.clock = Date.now() + 600 * 1000
    state = refreshSkillState(context, state)
    miroku = state.formation[0]
    skill = getSkill(miroku)
    expect(skill.transitionType).toBe("always")
    expect(skill.state.type).toBe("active")
  })
  test("発動なし-フットバース使用", () => {
    const context = initContext("test", "test", false)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [miroku])
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
    expect(access.defense?.triggeredSkills.length).toBe(0)
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    let accessLuna = getAccessDenco(access, "defense")
    expect(accessLuna.reboot).toBe(false)
  })
  test("発動なし-守備側", () => {
    const context = initContext("test", "test", false)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [miroku])
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
      station: miroku.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    expect(access.pinkMode).toBe(false)
    expect(access.defense?.triggeredSkills.length).toBe(0)
  })
  test("発動なし-攻撃側編成内", () => {
    const context = initContext("test", "test", false)
    context.clock = Date.parse('2022-01-01T23:00:00+0900')
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [reika, miroku])
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
    expect(access.offense.triggeredSkills.length).toBe(0)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [miroku])
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
  })
  test("発動あり-Rebootなし", () => {
    // 発動の通常
    const context = initContext("test", "test", false)
    context.clock = Date.parse('2022-01-01T23:00:00+0900')
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 80, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [miroku])
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
    expect(access.offense.triggeredSkills.length).toBe(1)
    let trigger = access.offense.triggeredSkills[0]
    expect(trigger.numbering).toBe("4")
    expect(trigger.name).toBe("miroku")
    expect(trigger.step).toBe("after_damage")
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
    expect(access.defense?.damage?.value).toBe(190)
    expect(access.damageBase).toBe(95)
    let accessLuna = getAccessDenco(access, "defense")
    expect(accessLuna.reboot).toBe(false)
    expect(accessLuna.hpBefore).toBe(360)
    expect(accessLuna.hpAfter).toBe(170)
  })
  test("発動あり-ひいる", () => {
    const context = initContext("test", "test", false)
    context.clock = Date.parse('2022-01-01T23:00:00+0900')
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 80, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [miroku, hiiru])
    offense = activateSkill(context, { ...offense, carIndex: 1 })
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
    // ひいるによる確率ブーストが乗る
    expect(access.offense.triggeredSkills.length).toBe(2)
    expect(hasSkillTriggered(access.offense, miroku)).toBe(true)
    expect(hasSkillTriggered(access.offense, hiiru)).toBe(true)
  })
  test("発動あり-Rebootあり", () => {
    const context = initContext("test", "test", false)
    context.clock = Date.parse('2022-01-01T12:00:00+0900')
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 80, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [miroku])
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
    expect(access.offense.triggeredSkills.length).toBe(1)
    let trigger = access.offense.triggeredSkills[0]
    expect(trigger.numbering).toBe("4")
    expect(trigger.name).toBe("miroku")
    expect(trigger.step).toBe("after_damage")
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    expect(access.defense?.damage?.value).toBe(494)
    expect(access.damageBase).toBe(247)
    let accessLuna = getAccessDenco(access, "defense")
    expect(accessLuna.reboot).toBe(true)
    expect(accessLuna.hpBefore).toBe(360)
    expect(accessLuna.hpAfter).toBe(0)
  })
  test("発動あり-サポータAKT上昇", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    context.clock = Date.parse('2022-01-01T23:00:00+0900')
    let luna = DencoManager.getDenco(context, "3", 80, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [miroku, reika])
    offense = activateSkill(context, { ...offense, carIndex: 1 })
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
    expect(access.offense.triggeredSkills.length).toBe(2)
    expect(hasSkillTriggered(access.offense, miroku)).toBe(true)
    expect(hasSkillTriggered(access.offense, reika)).toBe(true)
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
    expect(access.attackPercent).toBe(25)
    expect(access.defendPercent).toBe(50)
    if ( access.defense){
      expect(hasSkillTriggered(access.defense, luna)).toBe(true)
      expect(access.defense.damage?.value).toBe(284)
    }
    expect(access.damageBase).toBe(142)
    let accessLuna = getAccessDenco(access, "defense")
    expect(accessLuna.reboot).toBe(false)
    expect(accessLuna.hpBefore).toBe(360)
    expect(accessLuna.hpAfter).toBe(76)
  })
  test("発動なし-１回で相手をリブート", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    context.clock = Date.parse('2022-01-01T12:00:00+0900')
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [miroku, reika])
    offense = activateSkill(context, { ...offense, carIndex: 1 })
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
    expect(access.offense.triggeredSkills.length).toBe(1)
    let trigger = access.offense.triggeredSkills[0]
    expect(trigger.numbering).toBe("5")
    expect(trigger.name).toBe("reika")
    expect(trigger.step).toBe("damage_common")
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    expect(access.defense?.damage?.value).toBe(294)
    let accessLuna = getAccessDenco(access, "defense")
    expect(accessLuna.reboot).toBe(true)
    expect(accessLuna.hpBefore).toBe(240)
    expect(accessLuna.hpAfter).toBe(0)
  })
})