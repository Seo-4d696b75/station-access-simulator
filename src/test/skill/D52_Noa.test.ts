import { activateSkill, init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../tool/skillState"


describe("ノアのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "52",
    name: "noa"
  })
  test.each([1, 2, 3, 4])("発動あり-攻撃側(アクセス)-タイプx%d", (cnt) => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let noa = DencoManager.getDenco(context, "52", 50)
    let seria = DencoManager.getDenco(context, "1", 50)
    let luna = DencoManager.getDenco(context, "3", 50)
    let sheena = DencoManager.getDenco(context, "7", 50)
    let saya = DencoManager.getDenco(context, "8", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [noa, seria, luna, sheena, saya].slice(0, cnt + 1))
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
    expect(hasSkillTriggered(result, "offense", noa)).toBe(true)
    expect(result.attackPercent).toBe(10 * cnt)
  })
  test("発動あり-攻撃側(アクセス)-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let noa = DencoManager.getDenco(context, "52", 50)
    let luna = DencoManager.getDenco(context, "3", 50)
    let izuna = DencoManager.getDenco(context, "13", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [noa, hiiru, izuna, luna])
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", noa)).toBe(true)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    let t = getSkillTrigger(result, "offense", noa)[0]
    expect(t.skillName).toBe("カラーオブトレイン Lv.4")
    expect(t.probability).toBe(46)
    expect(t.boostedProbability).toBe(46 * 1.2)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)

    expect(result.attackPercent).toBe(20)
  })
  test("発動なし-攻撃側(アクセス)-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let noa = DencoManager.getDenco(context, "52", 50)
    let luna = DencoManager.getDenco(context, "3", 50)
    let izuna = DencoManager.getDenco(context, "13", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [noa, hiiru, izuna, luna])
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", noa)).toBe(false)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    let t = getSkillTrigger(result, "offense", noa)[0]
    expect(t.skillName).toBe("カラーオブトレイン Lv.4")
    expect(t.probability).toBe(46)
    expect(t.boostedProbability).toBe(46 * 1.2)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃側(アクセス)-単独", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let noa = DencoManager.getDenco(context, "52", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [noa])
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
    expect(hasSkillTriggered(result, "offense", noa)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let noa = DencoManager.getDenco(context, "52", 50, 1)
    let luna = DencoManager.getDenco(context, "3", 50)
    let izuna = DencoManager.getDenco(context, "13", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [noa, izuna, luna])
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
      station: noa.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", noa)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
})