import moment from "moment-timezone"
import { DencoManager, init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../skillState"

describe("レンのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "22",
    name: "ren",
    active: 1500,
    cooldown: 5400,
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