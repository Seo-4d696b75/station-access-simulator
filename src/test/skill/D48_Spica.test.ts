import { activateSkill, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../tool/skillState"

describe("スピカのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "48",
    name: "spica"
  })

  test("発動あり-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let spica = DencoManager.getDenco(context, "48", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, spica])
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, spica)).toBe(true)
    expect(result.defendPercent).toBe(17)
  })

  test("発動なし-守備側(被アクセス)-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let spica = DencoManager.getDenco(context, "48", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, spica])
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, spica)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })


  test("発動あり-守備側(被アクセス)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let spica = DencoManager.getDenco(context, "48", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, spica, hiiru])
    defense = activateSkill(context, defense, 2)
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, spica)).toBe(true)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    expect(result.defendPercent).toBe(17)
  })

  test("発動なし-守備側(被アクセス)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let spica = DencoManager.getDenco(context, "48", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, spica, hiiru])
    defense = activateSkill(context, defense, 2)
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, spica)).toBe(false)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    expect(result.defendPercent).toBe(0)
  })


  test("発動あり-守備側(被アクセス)-先頭", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let spica = DencoManager.getDenco(context, "48", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [spica, seria])
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, spica)).toBe(true)
    expect(result.defendPercent).toBe(17)
  })

  test("発動なし-守備側(被アクセス)-単独", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let spica = DencoManager.getDenco(context, "48", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [spica])
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
      station: spica.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, spica)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-守備側(被アクセス)-対象外", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let reika = DencoManager.getDenco(context, "1", 50)
    let spica = DencoManager.getDenco(context, "48", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika, seria, spica])
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, spica)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-攻撃側(アクセス)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let spica = DencoManager.getDenco(context, "48", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, spica])
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
    expect(hasSkillTriggered(result.offense, spica)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
})