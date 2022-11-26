import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { getFixedDamageDenco } from "../fake"
import { testManualSkill } from "../skillState"


describe("マコのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "62",
    name: "mako",
    active: 1200,
    cooldown: 10800,
  })


  test("発動あり-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mako = DencoManager.getDenco(context, "62", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 1)
    let offense = initUser(context, "とあるマスター", [seria, mako])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    // 属性揃える
    charlotte.link[0].attr = "eco"
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
    expect(hasSkillTriggered(result.offense, mako)).toBe(true)
    expect(result.damageBase).not.toBeUndefined()
    expect(result.damageBase!.variable).toBe(seria.ap)
    expect(result.damageBase!.constant).toBe(0)
    // 固定ダメージ追加
    expect(result.damageFixed).toBe(50)
    expect(result.attackPercent).toBe(0)
    // 経験値付与
    let d = result.defense!.formation[0]
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(seria.ap + 50)
    expect(d.reboot).toBe(false)
    expect(d.exp.access).toBe(0)
    expect(d.exp.link).toBe(0)
    expect(d.exp.skill).toBe(100)
  })

  test("発動なし-攻撃側(アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mako = DencoManager.getDenco(context, "62", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 1)
    let offense = initUser(context, "とあるマスター", [mako, seria])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    // 属性揃える
    charlotte.link[0].attr = "cool"
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
    expect(hasSkillTriggered(result.offense, mako)).toBe(false)
    // 固定ダメージ追加
    expect(result.damageFixed).toBe(0)
    expect(result.attackPercent).toBe(0)
    // 経験値付与
    let d = result.defense!.formation[0]
    expect(d.exp.skill).toBe(0)
  })

  test("発動なし-攻撃側(編成内)-属性違う", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mako = DencoManager.getDenco(context, "62", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 1)
    let offense = initUser(context, "とあるマスター", [seria, mako])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    // 属性揃えない
    charlotte.link[0].attr = "heat"
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
    expect(hasSkillTriggered(result.offense, mako)).toBe(false)
    // 固定ダメージ追加
    expect(result.damageFixed).toBe(0)
    expect(result.attackPercent).toBe(0)
    // 経験値付与
    let d = result.defense!.formation[0]
    expect(d.exp.skill).toBe(0)
  })

  test("発動あり-攻撃側(編成内)-固定ダメージ軽減10", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mako = DencoManager.getDenco(context, "62", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 1)
    let test = getFixedDamageDenco(-10)
    let offense = initUser(context, "とあるマスター", [seria, mako])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [charlotte, test])
    // 属性揃える
    charlotte.link[0].attr = "eco"
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
    expect(hasSkillTriggered(result.offense, mako)).toBe(true)
    expect(hasSkillTriggered(result.defense, test)).toBe(true)
    expect(result.damageBase).not.toBeUndefined()
    expect(result.damageBase!.variable).toBe(seria.ap)
    expect(result.damageBase!.constant).toBe(0)
    // 固定ダメージ追加
    expect(result.damageFixed).toBe(50 - 10)
    expect(result.attackPercent).toBe(0)
    // 経験値付与
    let d = result.defense!.formation[0]
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(seria.ap + 40)
    expect(d.reboot).toBe(false)
    expect(d.exp.access).toBe(0)
    expect(d.exp.link).toBe(0)
    expect(d.exp.skill).toBe(100)
  })
  test("発動あり-攻撃側(編成内)-固定ダメージ軽減200", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let mako = DencoManager.getDenco(context, "62", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 1)
    let test = getFixedDamageDenco(-200)
    let offense = initUser(context, "とあるマスター", [seria, mako])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [charlotte, test])
    // 属性揃える
    charlotte.link[0].attr = "eco"
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
    expect(hasSkillTriggered(result.offense, mako)).toBe(true)
    expect(hasSkillTriggered(result.defense, test)).toBe(true)
    expect(result.damageBase).not.toBeUndefined()
    expect(result.damageBase!.variable).toBe(seria.ap)
    expect(result.damageBase!.constant).toBe(0)
    // 固定ダメージ追加
    expect(result.damageFixed).toBe(50 - 200)
    expect(result.attackPercent).toBe(0)
    // 経験値付与
    let d = result.defense!.formation[0]
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(seria.ap - 150)
    expect(d.reboot).toBe(false)
    expect(d.exp.access).toBe(0)
    expect(d.exp.link).toBe(0)
    expect(d.exp.skill).toBe(100)
  })
})