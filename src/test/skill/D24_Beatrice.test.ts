import { DencoManager, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import { activateSkill, getSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../skillState"

describe("ベアトリスのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "24",
    name: "beatrice",
    active: 14400,
    cooldown: 3600
  })

  test("発動なし-非アクティブ", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 50, 1)
    let saya = DencoManager.getDenco(context, "8", 50)
    let offense = initUser(context, "とあるマスター", [saya])
    let defense = initUser(context, "とあるマスター２", [beatrice])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: beatrice.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, beatrice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let saya = DencoManager.getDenco(context, "8", 50)
    let offense = initUser(context, "とあるマスター", [saya, reika])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [beatrice])
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
      station: beatrice.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, reika)).toBe(true)
    expect(hasSkillTriggered(result.defense, beatrice)).toBe(true)
    expect(getSkill(beatrice).property.readNumber("DEF")).toBe(75)
    expect(result.defendPercent).toBe(Math.floor(75 * (saya.ap - beatrice.ap) / saya.ap))
    expect(result.attackPercent).toBe(25)
  })
  test("発動なし-自身APの方が高い場合", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 80, 1)
    let saya = DencoManager.getDenco(context, "8", 10)
    expect(beatrice.ap).toBeGreaterThan(saya.ap)
    let offense = initUser(context, "とあるマスター", [saya])
    let defense = initUser(context, "とあるマスター２", [beatrice])
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
      station: beatrice.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, beatrice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 50)
    let saya = DencoManager.getDenco(context, "8", 50, 1)
    let offense = initUser(context, "とあるマスター", [beatrice])
    let defense = initUser(context, "とあるマスター２", [saya])
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
      station: saya.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, beatrice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-守備側編成内", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let saya = DencoManager.getDenco(context, "8", 50)
    let offense = initUser(context, "とあるマスター", [saya])
    let defense = initUser(context, "とあるマスター２", [reika, beatrice])
    defense = activateSkill(context, defense, 0, 1)
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, beatrice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
})