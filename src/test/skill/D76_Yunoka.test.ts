import { DencoManager, init } from "../.."
import { getAccessDenco, getDefense, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { getDefPercentDenco, getFixedDamageDenco } from "../tool/fake"
import { testManualSkill } from "../tool/skillState"

describe("ゆのかのスキル", () => {
  beforeAll(init)


  testManualSkill({
    number: "76",
    name: "yunoka",
    active: 900,
    cooldown: 5400,
  })
  
  test("発動なし-相手なし", () => {
    const context = initContext("test", "test", false)
    let yunoka = DencoManager.getDenco(context, "76", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [yunoka])
    offense = activateSkill(context, offense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(hasSkillTriggered(result, "offense", yunoka)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-フットバース", () => {
    const context = initContext("test", "test", false)
    let yunoka = DencoManager.getDenco(context, "76", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [yunoka])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "master2", [charlotte])
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
      usePink: true
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", yunoka)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-非アクティブ", () => {
    const context = initContext("test", "test", false)
    let yunoka = DencoManager.getDenco(context, "76", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [yunoka])
    let defense = initUser(context, "master2", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0]
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", yunoka)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    let yunoka = DencoManager.getDenco(context, "76", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [yunoka])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "master2", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0]
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(result.linkDisconnected).toBe(true)
    expect(hasSkillTriggered(result, "offense", yunoka)).toBe(true)
    expect(result.attackPercent).toBe(39)
    expect(result.damageBase?.variable).toBe(346)

    let t = getSkillTrigger(result, "offense", yunoka)[0]
    expect(t.skillName).toBe("ほっと・バスタイム Lv.4")
    expect(t.probability).toBe(100)
    expect(t.type).toBe("damage_atk")
    expect(t.triggered).toBe(true)
    t = getSkillTrigger(result, "offense", yunoka)[1]
    expect(t).toBeUndefined()
  })
  test("発動あり-回復あり-正ダメージ量", () => {
    const context = initContext("test", "test", false)
    let yunoka = DencoManager.getDenco(context, "76", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let test = getDefPercentDenco(100)
    let offense = initUser(context, "とあるマスター", [yunoka])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "master2", [charlotte, test])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0]
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", yunoka)).toBe(true)
    expect(hasSkillTriggered(result, "defense", test)).toBe(true)
    expect(result.attackPercent).toBe(39)
    expect(result.defendPercent).toBe(100)
    expect(yunoka.ap).toBe(192)
    const damage = Math.floor(192 * 0.39 * 1.3)
    expect(charlotte.maxHp).toBe(228)
    const heal = Math.floor(228 * 0.18)
    expect(damage).toBeGreaterThan(heal)
    expect(result.damageBase?.variable).toBe(damage) // スキルの回復量含まず
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.damage?.value).toBe(damage - heal)
    expect(d.currentHp).toBe(charlotte.maxHp - damage + heal)

    let t = getSkillTrigger(result, "offense", yunoka)[0]
    expect(t.skillName).toBe("ほっと・バスタイム Lv.4")
    expect(t.probability).toBe(100)
    expect(t.type).toBe("damage_atk")
    expect(t.triggered).toBe(true)
    t = getSkillTrigger(result, "offense", yunoka)[1]
    expect(t.skillName).toBe("ほっと・バスタイム Lv.4")
    expect(t.probability).toBe(100)
    expect(t.type).toBe("skill_recipe")
    expect(t.triggered).toBe(true)
  })
  test("発動あり-回復あり-負ダメージ量", () => {
    const context = initContext("test", "test", false)
    let yunoka = DencoManager.getDenco(context, "76", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    charlotte.currentHp = 100
    let test = getDefPercentDenco(139)
    let offense = initUser(context, "とあるマスター", [yunoka])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "master2", [charlotte, test])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0]
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", yunoka)).toBe(true)
    expect(hasSkillTriggered(result, "defense", test)).toBe(true)
    expect(result.attackPercent).toBe(39)
    expect(result.defendPercent).toBe(139)
    expect(yunoka.ap).toBe(192)
    expect(charlotte.maxHp).toBe(228)
    const heal = Math.floor(228 * 0.18)
    expect(result.damageBase?.variable).toBe(1) // DEF&ATK合計が0%なので1
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.damage?.value).toBe(1 - heal)
    expect(d.currentHp).toBe(charlotte.currentHp - 1 + heal)
  })
  test("発動あり-回復あり-ダメージ0", () => {
    const context = initContext("test", "test", false)
    let yunoka = DencoManager.getDenco(context, "76", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    charlotte.currentHp = charlotte.maxHp - 10
    let test1 = getDefPercentDenco(139)
    let test2 = getFixedDamageDenco(-10)
    let offense = initUser(context, "とあるマスター", [yunoka])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "master2", [charlotte, test1, test2])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0]
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", yunoka)).toBe(true)
    expect(hasSkillTriggered(result, "defense", test1)).toBe(true)
    expect(hasSkillTriggered(result, "defense", test2)).toBe(true)
    expect(result.attackPercent).toBe(39)
    expect(result.defendPercent).toBe(139)
    expect(result.damageFixed).toBe(-10)
    expect(yunoka.ap).toBe(192)
    expect(charlotte.maxHp).toBe(228)
    const heal = Math.floor(228 * 0.18)
    expect(result.damageBase?.variable).toBe(1) // DEF&ATK合計が0%なので1
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.damage?.value).toBe(-heal) //固定ダメージ軽減によりダメージ量0となり回復量がそのまま入る
    expect(d.currentHp).toBe(charlotte.maxHp)
  })
  test("発動あり-回復あり-ミオあり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let yunoka = DencoManager.getDenco(context, "76", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 80)
    let offense = initUser(context, "とあるマスター", [yunoka])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "master2", [charlotte, mio])
    defense = activateSkill(context, defense, 1)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0]
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", yunoka)).toBe(true)
    expect(hasSkillTriggered(result, "defense", mio)).toBe(true)
    expect(result.attackPercent).toBe(39)
    expect(result.defendPercent).toBe(0)
    expect(yunoka.ap).toBe(192)
    expect(yunoka.ap).toBe(192)
    const damage = Math.floor(192 * 1.39)
    const heal = Math.floor(228 * 0.18)
    expect(result.damageBase?.variable).toBe(1) // ミオが全ダメージ肩代わり
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.damage?.value).toBe(1 - heal)
    d = getDefense(result).formation[1]
    expect(d.damage?.value).toBe(damage)
    expect(d.hpAfter).toBe(d.maxHp - damage)
  })

})
