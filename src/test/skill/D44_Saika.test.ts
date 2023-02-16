import { activateSkill, getSkillTrigger, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import { testAlwaysSkill } from "../tool/skillState"

describe("さいかのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "44",
    name: "saika"
  })

  test("発動なし-攻撃側(アクセス)-3km未満", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    offense.user.daily = {
      distance: 2.9
    }
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
    expect(hasSkillTriggered(result, "offense", saika)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃側(アクセス)-相手不在", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    offense.user.daily = {
      distance: 100
    }
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(hasSkillTriggered(result, "offense", saika)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    offense.user.daily = {
      distance: 100
    }
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", saika)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test.each([5, 10, 50, 80, 100, 200, 360, 400])("発動あり-攻撃側(アクセス)-%dkm", (dist) => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    offense.user.daily = {
      distance: dist
    }
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
    expect(hasSkillTriggered(result, "offense", saika)).toBe(true)
    expect(result.attackPercent).toBe(
      0.28 * Math.min(dist, 100)
      + 0.1 * Math.max(Math.min(dist, 360) - 100, 0)
    )
  })

  test("発動なし-エリア無効化", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let saika = DencoManager.getDenco(context, "44", 50)
    let eria = DencoManager.getDenco(context, "33", 50, 1)
    let offense = initUser(context, "とあるマスター", [saika, seria])
    let defense = initUser(context, "とあるマスター２", [eria])
    defense = activateSkill(context, defense, 0)
    offense.user.daily = {
      distance: 100
    }
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: eria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", saika)).toBe(false)
    expect(hasSkillTriggered(result, "defense", eria)).toBe(true)
    expect(result.attackPercent).toBe(0)

    let t = getSkillTrigger(result, "offense", saika)[0]
    expect(t.skillName).toBe("エナジーロード Lv.4")
    expect(t.probability).toBe(100)
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
  })
})
