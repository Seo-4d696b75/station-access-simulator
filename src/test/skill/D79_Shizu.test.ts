import assert from "assert"
import { init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("シズのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "79",
    name: "shizu",
    active: 1800,
    cooldown: 9000,
  })


  test.each([1, 2, 3, 4])("自身ATK上昇 相手編成の属性x%d", (cnt) => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let shizu = DencoManager.getDenco(context, "79", 50)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let siira = DencoManager.getDenco(context, "11", 50)
    let luna = DencoManager.getDenco(context, "3", 50)
    let moe = DencoManager.getDenco(context, "9", 50)
    moe.attr = "flat"
    let offense = initUser(context, "とあるマスター", [shizu, reika])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(
      context,
      "とあるマスター２",
      [miroku, siira, luna, moe].slice(0, cnt)
    )
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: miroku.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", shizu)).toBe(true)

    // ATK増加 DEF減少
    expect(result.attackPercent).toBe(14)
    expect(result.defendPercent).toBe(-5.5 * cnt)

    let t = getSkillTrigger(result, "offense", shizu)[0]
    expect(t.skillName).toBe("カンペキテンサイおでかけプラン Lv.4")
    expect(t.type).toBe("damage_atk")
    expect(t.triggered).toBe(true)
    t = getSkillTrigger(result, "offense", shizu)[1]
    expect(t.skillName).toBe("カンペキテンサイおでかけプラン Lv.4")
    expect(t.type).toBe("damage_def")
    expect(t.triggered).toBe(true)
  })
  test.each([1, 2, 3, 4])("編成内ATK上昇 相手編成の属性x%d", (cnt) => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let shizu = DencoManager.getDenco(context, "79", 50)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let siira = DencoManager.getDenco(context, "11", 50)
    let luna = DencoManager.getDenco(context, "3", 50)
    let moe = DencoManager.getDenco(context, "9", 50)
    moe.attr = "flat"
    let offense = initUser(context, "とあるマスター", [reika, shizu])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(
      context,
      "とあるマスター２",
      [miroku, siira, luna, moe].slice(0, cnt)
    )
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: miroku.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", shizu)).toBe(true)
    
    // ATK増加 DEF減少
    expect(result.attackPercent).toBe(14)
    expect(result.defendPercent).toBe(-5.5 * cnt)

    let t = getSkillTrigger(result, "offense", shizu)[0]
    expect(t.skillName).toBe("カンペキテンサイおでかけプラン Lv.4")
    expect(t.type).toBe("damage_atk")
    expect(t.triggered).toBe(true)
    t = getSkillTrigger(result, "offense", shizu)[1]
    expect(t.skillName).toBe("カンペキテンサイおでかけプラン Lv.4")
    expect(t.type).toBe("damage_def")
    expect(t.triggered).toBe(true)
  })
  test("発動なし heat以外あり", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let shizu = DencoManager.getDenco(context, "79", 50)
    let siira = DencoManager.getDenco(context, "11", 50)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, shizu, siira])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [miroku])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: miroku.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", shizu)).toBe(false)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
  })

  test("ミオのダメージ計算", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let reika = DencoManager.getDenco(context, "5", 50)
    let shizu = DencoManager.getDenco(context, "79", 50)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let siira = DencoManager.getDenco(context, "11", 50)
    let mio = DencoManager.getDenco(context, "36", 50)
    mio.currentHp = 100
    let offense = initUser(context, "とあるマスター", [reika, shizu])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [miroku, siira, mio])
    defense = activateSkill(context, defense, 2)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: miroku.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", shizu)).toBe(true)
    expect(hasSkillTriggered(result, "defense", mio)).toBe(true)
    expect(result.attackPercent).toBe(14)
    expect(result.defendPercent).toBe(-16.5)
    // ミオの肩代わり対象のダメージ計算はATK増加のみ加味する
    expect(reika.ap).toBe(200)
    const damage = 200 * 1.14
    assert(result.defense)
    let d = result.defense.formation[2]
    expect(d.hpAfter).toBe(1)
    expect(d.damage?.value).toBe(99)
    // 肩代わり貫通分のダメージ計算はDEFも加味される
    d = result.defense.formation[0]
    expect(d.damage?.value).toBe(Math.floor((damage - 99) * 1.165))
  })

})