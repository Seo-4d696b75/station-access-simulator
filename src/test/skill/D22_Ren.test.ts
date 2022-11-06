import { DencoManager, init } from "../.."
import { initContext } from "../../core/context"
import { initUser, refreshState } from "../../core/user"
import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getSkill } from "../../core/skill"
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"

describe("レンのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let ren = DencoManager.getDenco(context, "22", 50)
    expect(ren.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [ren])
    const now = moment().valueOf()
    context.clock = now
    ren = state.formation[0]
    expect(ren.name).toBe("ren")
    let skill = getSkill(ren)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    expect(() => deactivateSkill(context, state, 0)).toThrowError()
    state = activateSkill(context, state, 0)
    ren = state.formation[0]
    skill = getSkill(ren)
    expect(skill.state.type).toBe("active")
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.data).not.toBeUndefined()
    if (skill.state.type === "active" && skill.state.transition === "manual" && skill.state.data) {
      let data = skill.state.data
      expect(data.activeTimeout).toBe(now + 1500 * 1000)
      expect(data.cooldownTimeout).toBe(now + 1500 * 1000 + 5400 * 1000)
    }
    expect(() => deactivateSkill(context, state, 0)).toThrowError()

    // 10分経過
    context.clock = now + 600 * 1000
    state = refreshState(context, state)
    ren = state.formation[0]
    skill = getSkill(ren)
    expect(skill.state.type).toBe("active")

    // 25分経過
    context.clock = now + 1500 * 1000
    state = refreshState(context, state)
    ren = state.formation[0]
    skill = getSkill(ren)
    expect(skill.state.type).toBe("cooldown")
    expect(skill.state.transition).toBe("manual")
    if (skill.state.type === "cooldown" && skill.state.transition === "manual") {
      let timeout = skill.state.data
      expect(timeout.cooldownTimeout).toBe(now + (1500 + 5400) * 1000)
    }

    // 25分 + 1.5時間経過
    context.clock = now + (1500 + 5400) * 1000
    state = refreshState(context, state)
    ren = state.formation[0]
    skill = getSkill(ren)
    expect(skill.state.type).toBe("idle")
  })
  test("発動なし-非アクティブ", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let ren = DencoManager.getDenco(context, "22", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [ren])
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, ren)).toBe(false)
    expect(hasSkillTriggered(result.defense, luna)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.skillInvalidated).toBe(false)
    expect(result.defendPercent).toBe(25)
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let ren = DencoManager.getDenco(context, "22", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [ren])
    offense = activateSkill(context, offense, 0)
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, ren)).toBe(true)
    expect(hasSkillTriggered(result.defense, luna)).toBe(false)
    let d = getAccessDenco(result, "defense")
    expect(d.skillInvalidated).toBe(true)
    expect(result.defendPercent).toBe(0)
  })
  test("発動あり-マイナス効果も無効化", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let ren = DencoManager.getDenco(context, "22", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [ren])
    offense = activateSkill(context, offense, 0)
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, ren)).toBe(true)
    expect(hasSkillTriggered(result.defense, luna)).toBe(false)
    let d = getAccessDenco(result, "defense")
    expect(d.skillInvalidated).toBe(true)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-対象外", () => {
    const context = initContext("test", "test", false)
    let fubu = DencoManager.getDenco(context, "14", 50, 1)
    let ren = DencoManager.getDenco(context, "22", 50, 1)
    let defense = initUser(context, "とあるマスター", [fubu])
    defense = activateSkill(context, defense, 0)
    let offense = initUser(context, "とあるマスター２", [ren])
    offense = activateSkill(context, offense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: fubu.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, ren)).toBe(false)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.skillInvalidated).toBe(false)
    expect(result.defendPercent).toBe(19)
  })
  test("発動なし-相手編成内", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let ren = DencoManager.getDenco(context, "22", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika, luna])
    let offense = initUser(context, "とあるマスター２", [ren])
    offense = activateSkill(context, offense, 0)
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
    expect(hasSkillTriggered(result.offense, ren)).toBe(false)
    expect(hasSkillTriggered(result.defense, luna)).toBe(false)
    expect(result.defense).not.toBeUndefined()
    if (result.defense) {
      let d = result.defense.formation[1]
      expect(d.skillInvalidated).toBe(false)
    }
  })
  test("発動なし-攻撃編成内", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50, 1)
    let ren = DencoManager.getDenco(context, "22", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [fubu, ren])
    offense = activateSkill(context, offense, 1)
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, ren)).toBe(false)
    expect(hasSkillTriggered(result.defense, luna)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.skillInvalidated).toBe(false)
    expect(result.defendPercent).toBe(25)
  })
  test("発動なし-被アクセス", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let ren = DencoManager.getDenco(context, "22", 50, 1)
    let defense = initUser(context, "とあるマスター", [ren])
    let offense = initUser(context, "とあるマスター２", [luna])
    defense = activateSkill(context, defense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: ren.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, ren)).toBe(false)
    expect(hasSkillTriggered(result.offense, luna)).toBe(false)
    let d = getAccessDenco(result, "offense")
    expect(d.skillInvalidated).toBe(false)
  })
})