import { DencoManager, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import { Random, RandomMode } from "../../core/random"
import { activateSkill, getSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../tool/skillState"

describe("みらいのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "23",
    name: "mirai"
  })

  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let mirai = DencoManager.getDenco(context, "23", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    const offense = initUser(context, "とあるマスター１", [mirai])
    const defense = initUser(context, "とあるマスター２", [charlotte])
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
    expect(hasSkillTriggered(result.offense, mirai)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mirai = DencoManager.getDenco(context, "23", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    const offense = initUser(context, "とあるマスター１", [mirai])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(hasSkillTriggered(result.offense, mirai)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let mirai = DencoManager.getDenco(context, "23", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター１", [mirai, hiiru])
    offense = activateSkill(context, offense, 1)
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
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
    expect(hasSkillTriggered(result.offense, mirai)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃編成内", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mirai = DencoManager.getDenco(context, "23", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター１", [hiiru, mirai])
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
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(false)
    expect(hasSkillTriggered(result.offense, mirai)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-被アクセス", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mirai = DencoManager.getDenco(context, "23", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let offense = initUser(context, "とあるマスター１", [charlotte])
    let defense = initUser(context, "とあるマスター２", [mirai])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: mirai.link[0],
    }
    const result = startAccess(context, config)
    expect(hasSkillTriggered(result.defense, mirai)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    let mirai = DencoManager.getDenco(context, "23", 50)
    let skill = getSkill(mirai)
    expect(skill.level).toBe(4)
    expect(skill.property.readNumber("probability")).toBe(80)
    expect(skill.property.readNumber("ATK_lower")).toBe(-39)
    expect(skill.property.readNumber("ATK_upper")).toBe(60)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター１", [mirai, hiiru])
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
    const mockRandomFun = jest.fn(() => 0.5)
    const mockRandom = jest.fn<Random, []>(() =>
      Object.assign(mockRandomFun, { mode: "force" as RandomMode })
    )
    context.random = mockRandom()
    const result = startAccess(context, config)
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(false)
    expect(hasSkillTriggered(result.offense, mirai)).toBe(true)
    expect(result.attackPercent).toBe(-39 + Math.floor(99 * 0.5))
    expect(mockRandomFun).toBeCalledTimes(1)
    expect(mockRandomFun.mock.results[0].value).toBe(0.5)
  })
  test("発動あり-確率補正あり", () => {
    const context = initContext("test", "test", false)
    let mirai = DencoManager.getDenco(context, "23", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター１", [mirai, hiiru])
    offense = activateSkill(context, offense, 1)
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
    const mockRandomFun = jest.fn(() => 0.8)
    const mockRandom = jest.fn<Random, []>(() =>
      Object.assign(mockRandomFun, { mode: "force" as RandomMode })
    )
    context.random = mockRandom()
    const result = startAccess(context, config)
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
    expect(hasSkillTriggered(result.offense, mirai)).toBe(true)
    expect(result.attackPercent).toBe(-39 + Math.floor(99 * 0.8))
    expect(mockRandomFun).toBeCalledTimes(1)
    expect(mockRandomFun.mock.results[0].value).toBe(0.8)
  })
  test("発動あり-ATK+0%", () => {
    const context = initContext("test", "test", false)
    let mirai = DencoManager.getDenco(context, "23", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター１", [mirai, hiiru])
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
    const r = 39.5 / (39 + 60)
    const mockRandomFun = jest.fn(() => r)
    const mockRandom = jest.fn<Random, []>(() =>
      Object.assign(mockRandomFun, { mode: "force" as RandomMode })
    )
    context.random = mockRandom()
    const result = startAccess(context, config)
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(false)
    expect(hasSkillTriggered(result.offense, mirai)).toBe(true)
    expect(result.attackPercent).toBe(0)
    expect(mockRandomFun).toBeCalledTimes(1)
    expect(mockRandomFun.mock.results[0].value).toBe(r)
  })

})