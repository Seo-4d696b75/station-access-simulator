import assert from "assert"
import { activateSkill, init, initContext, initUser, startAccess } from "../.."
import { getSkillTrigger, hasSkillTriggered } from "../../core/access/"
import DencoManager from "../../core/dencoManager"
import { testAlwaysSkill } from "../tool/skillState"

describe("しいらのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "11",
    name: "siira"
  })

  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    let siira = DencoManager.getDenco(context, "11", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [siira])
    let defense = initUser(context, "とあるマスター２", [reika])
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
    expect(hasSkillTriggered(result, "offense", siira)).toBe(false)
  })
  test("発動なし-自身以外が被アクセス", () => {
    const context = initContext("test", "test", false)
    let siira = DencoManager.getDenco(context, "11", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [charlotte, siira])
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
    assert(result.defense)
    expect(hasSkillTriggered(result, "defense", siira)).toBe(false)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [charlotte, siira])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    // 基本的なダメージの確認
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", siira)).toBe(false)
    let t = getSkillTrigger(result, "defense", siira)[0]
    expect(t.probability).toBe(25)
    expect(t.boostedProbability).toBe(25)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.damageBase?.variable).toBe(260)
    expect(result.damageRatio).toBe(1.3)
    assert(result.defense)
    // アクセス中の状態の確認
    let accessSiira = result.defense.formation[1]
    expect(accessSiira.damage).not.toBeUndefined()
    expect(accessSiira.damage?.value).toBe(260)
    expect(accessSiira.damage?.attr).toBe(true)
    expect(accessSiira.hpBefore).toBe(252)
    expect(accessSiira.hpAfter).toBe(0)
    expect(accessSiira.reboot).toBe(true)
    expect(accessSiira.exp.access.total).toBe(0)
    expect(accessSiira.exp.skill).toBe(0)

    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    // リブート確認
    defense = result.defense
    siira = defense.formation[1]
    expect(siira.currentHp).toBe(252)
    expect(defense.event.length).toBe(2)
    let event = defense.event[1]
    expect(event.type).toBe("reboot")
    assert(event.type === "reboot")
    expect(accessSiira.exp.total).toBe(event.data.exp)
    expect(siira.currentExp).toBe(0 + event.data.exp)
    expect(result.defense?.displayedExp).toBe(0 + event.data.exp)
  })
  test("発動なし-確率-ひいる補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [hiiru, siira])
    defense = activateSkill(context, defense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    // 基本的なダメージの確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defendPercent).toBe(0)
    expect(result.damageBase?.variable).toBe(260)
    expect(result.damageRatio).toBe(1.3)
    assert(result.defense)
    // 確率補正の確認
    expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)
    expect(hasSkillTriggered(result, "defense", siira)).toBe(false)
    let t = getSkillTrigger(result, "defense", siira)[0]
    expect(t.probability).toBe(25)
    expect(t.boostedProbability).toBe(25 * 1.2)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)

    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [charlotte, siira])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    // 基本的なダメージの確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defendPercent).toBe(25)
    expect(result.damageBase?.variable).toBe(195)
    expect(result.damageRatio).toBe(1.3)
    assert(result.defense)
    // アクセス中の状態の確認
    expect(hasSkillTriggered(result, "defense", siira)).toBe(true)
    let t = getSkillTrigger(result, "defense", siira)[0]
    expect(t.probability).toBe(25)
    expect(t.boostedProbability).toBe(25)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
    let accessSiira = result.defense.formation[1]
    expect(accessSiira.damage).not.toBeUndefined()
    expect(accessSiira.damage?.value).toBe(195)
    expect(accessSiira.damage?.attr).toBe(true)
    expect(accessSiira.hpBefore).toBe(252)
    expect(accessSiira.hpAfter).toBe(57)
    expect(accessSiira.reboot).toBe(false)
    expect(accessSiira.exp.total).toBe(0)
    expect(result.defense.displayedExp).toBe(0)

    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })
  test("発動あり-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [hiiru, siira])
    defense = activateSkill(context, defense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    // 基本的なダメージの確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defendPercent).toBe(25)
    expect(result.damageBase?.variable).toBe(195)
    expect(result.damageRatio).toBe(1.3)
    assert(result.defense)
    // アクセス中の状態の確認
    expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)
    expect(hasSkillTriggered(result, "defense", siira)).toBe(true)
    let t = getSkillTrigger(result, "defense", siira)[0]
    expect(t.probability).toBe(25)
    expect(t.boostedProbability).toBe(25 * 1.2)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)

    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })
})