import { init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("ニナのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "75",
    name: "nina",
    active: 2700,
    cooldown: 9000
  })

  test("発動あり-攻撃側(アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let nina = DencoManager.getDenco(context, "75", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [nina, seria])
    offense = activateSkill(context, offense, 0)
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
    expect(hasSkillTriggered(result, "offense", nina)).toBe(true)
    expect(result.attackPercent).toBe(30)
    // 経験値追加
    let d = result.defense!.formation[0]
    expect(d.exp.skill).toBe(360)

    let t = getSkillTrigger(result, "offense", nina)[0]
    expect(t.skillName).toBe("ねっけつレッスン Lv.4")
    expect(t.probability).toBe(100)
    expect(t.type).toBe("exp_delivery")
    t = getSkillTrigger(result, "offense", nina)[1]
    expect(t.skillName).toBe("ねっけつレッスン Lv.4")
    expect(t.probability).toBe(100)
    expect(t.type).toBe("damage_atk")
  })
  test("発動なし-攻撃側(アクセス)-スキルidle", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let nina = DencoManager.getDenco(context, "75", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [nina, seria])
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
    expect(hasSkillTriggered(result, "offense", nina)).toBe(false)
    expect(result.attackPercent).toBe(0)
    // 経験値追加
    let d = result.defense!.formation[0]
    expect(d.exp.skill).toBe(0)
  })
  test("発動なし-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let nina = DencoManager.getDenco(context, "75", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, nina])
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
    expect(hasSkillTriggered(result, "offense", nina)).toBe(false)
    expect(result.attackPercent).toBe(0)
    // 経験値追加
    let d = result.defense!.formation[0]
    expect(d.exp.skill).toBe(0)
  })
  test("発動あり-エリア無効化の影響", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let nina = DencoManager.getDenco(context, "75", 50)
    let eria = DencoManager.getDenco(context, "33", 50, 1)
    let offense = initUser(context, "とあるマスター", [nina, seria])
    offense = activateSkill(context, offense, 0)
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
    expect(hasSkillTriggered(result, "offense", nina)).toBe(true)
    expect(result.attackPercent).toBe(0)
    // 経験値追加
    let d = result.defense!.formation[0]
    expect(d.exp.skill).toBe(360)

    // ATK増加のみ無効化
    let triggers = getSkillTrigger(result, "offense", nina)
    expect(triggers.length).toBe(2)
    let t = triggers[0]
    expect(t.skillName).toBe("ねっけつレッスン Lv.4")
    expect(t.probability).toBe(100)
    expect(t.type).toBe("exp_delivery")
    expect(t.invalidated).toBe(false)
    expect(t.triggered).toBe(true)
    t = triggers[1]
    expect(t.skillName).toBe("ねっけつレッスン Lv.4")
    expect(t.probability).toBe(100)
    expect(t.type).toBe("damage_atk")
    expect(t.invalidated).toBe(true)
    expect(t.triggered).toBe(false)
  })
})