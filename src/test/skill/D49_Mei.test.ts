import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../skillState"

describe("メイのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "49",
    name: "mei",
    active: 4500,
    cooldown: 9000,
  })

  test("発動あり-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mei = DencoManager.getDenco(context, "49", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 10)
    let defense = initUser(context, "とあるマスター", [mei, seria])
    defense = activateSkill(context, defense, 0)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    expect(mei.currentHp).toBeGreaterThan(charlotte.currentHp)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: mei.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, mei)).toBe(true)
    const def = Math.floor(71 * Math.pow((mei.currentHp - charlotte.currentHp) / mei.maxHp, 0.5))
    expect(result.defendPercent).toBe(def)
  })
  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mei = DencoManager.getDenco(context, "49", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [mei, seria])
    defense = activateSkill(context, defense, 0)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    expect(mei.currentHp).toBeLessThan(charlotte.currentHp)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: mei.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, mei)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動あり-守備側(被アクセス)-現在HPを参照", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mei = DencoManager.getDenco(context, "49", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    charlotte.currentHp = 1
    let defense = initUser(context, "とあるマスター", [mei, seria])
    defense = activateSkill(context, defense, 0)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    expect(mei.currentHp).toBeGreaterThan(charlotte.currentHp)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: mei.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, mei)).toBe(true)
    expect(result.defendPercent).toBeGreaterThan(0)
  })
  test("発動なし-守備側(被アクセス)-現在HPを参照", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mei = DencoManager.getDenco(context, "49", 50, 1)
    mei.currentHp = 1
    let charlotte = DencoManager.getDenco(context, "6", 10)
    let defense = initUser(context, "とあるマスター", [mei, seria])
    defense = activateSkill(context, defense, 0)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    expect(mei.currentHp).toBeLessThan(charlotte.currentHp)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: mei.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, mei)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-守備側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let mei = DencoManager.getDenco(context, "49", 50)
    let charlotte = DencoManager.getDenco(context, "6", 10)
    let defense = initUser(context, "とあるマスター", [mei, seria])
    defense = activateSkill(context, defense, 0)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    expect(mei.currentHp).toBeGreaterThan(charlotte.currentHp)
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
    expect(hasSkillTriggered(result.defense, mei)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-攻撃側(アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mei = DencoManager.getDenco(context, "49", 50)
    let charlotte = DencoManager.getDenco(context, "6", 10, 1)
    let offense = initUser(context, "とあるマスター", [mei, seria])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    expect(mei.currentHp).toBeGreaterThan(charlotte.currentHp)
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
    expect(hasSkillTriggered(result.offense, mei)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
})