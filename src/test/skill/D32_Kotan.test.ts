import { activateSkill, getSkillTrigger, hasSkillTriggered, init, initContext, initUser, isSkillActive, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import StationManager from "../../core/stationManager"
import { testAlwaysSkill } from "../tool/skillState"

describe("コタンのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "32",
    name: "kotan",
  })

  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let kotan = DencoManager.getDenco(context, "32", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [kotan, seria])
    defense.user.getDailyAccessCount = (_) => 20

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
      station: kotan.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", kotan)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, kotan])
    offense.user.getDailyAccessCount = (_) => 20

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
    expect(hasSkillTriggered(result, "offense", kotan)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動あり-攻撃側(アクセス)-相手なし", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let offense = initUser(context, "とあるマスター", [kotan, seria])
    offense.user.getDailyAccessCount = (_) => 20

    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: StationManager.getRandomStation(context, 1)[0]
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(hasSkillTriggered(result, "offense", kotan)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test.each([1, 2, 5, 10, 20, 50, 100])("発動あり-攻撃側(アクセス)-%d駅", (count) => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [kotan, seria])
    offense.user.getDailyAccessCount = (_) => count

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
    expect(hasSkillTriggered(result, "offense", kotan)).toBe(true)
    const atk = Math.floor(50 * Math.min(50, count) / 50)
    expect(result.attackPercent).toBe(atk)
  })

  test("発動あり-攻撃側(アクセス)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [kotan, hiiru])
    offense.user.getDailyAccessCount = (_) => 20

    offense = activateSkill(context, offense, 1)
    hiiru = offense.formation[1]
    expect(isSkillActive(hiiru.skill)).toBe(true)
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
    expect(hasSkillTriggered(result, "offense", kotan)).toBe(true)
    // 確率補正は効かない
    const t = getSkillTrigger(result, "offense", kotan)[0]
    expect(t.skillName).toBe("ボイラー出力上昇 Lv.4")
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(100)
    expect(t.triggered).toBe(true)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(false)
    expect(result.attackPercent).toBeGreaterThan(0)
  })

  test("発動なし-エリア無効化", () => {
    const context = initContext("test", "test", false)
    let kotan = DencoManager.getDenco(context, "32", 50)
    let eria = DencoManager.getDenco(context, "33", 50, 1)
    let offense = initUser(context, "とあるマスター", [kotan])
    offense.user.getDailyAccessCount = (_) => 20
    let defense = initUser(context, "とあるマスター２", [eria])
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
      station: eria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", kotan)).toBe(false)
    expect(hasSkillTriggered(result, "defense", eria)).toBe(true)
    // 無効化
    const t = getSkillTrigger(result, "offense", kotan)[0]
    expect(t.skillName).toBe("ボイラー出力上昇 Lv.4")
    expect(t.probability).toBe(100)
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
})