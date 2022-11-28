import { activateSkill, init, initContext, initUser, startAccess } from "../.."
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
    expect(result.offense.triggeredSkills.length).toBe(0)
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
    if (result.defense) {
      expect(result.defense.triggeredSkills.length).toBe(0)
    }
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
    expect(result.defense?.triggeredSkills.length).toBe(0)
    expect(result.defendPercent).toBe(0)
    expect(result.damageBase?.variable).toBe(260)
    expect(result.damageRatio).toBe(1.3)
    if (result.defense) {
      // アクセス中の状態の確認
      let accessSiira = result.defense.formation[1]
      expect(accessSiira.damage).not.toBeUndefined()
      expect(accessSiira.damage?.value).toBe(260)
      expect(accessSiira.damage?.attr).toBe(true)
      expect(accessSiira.hpBefore).toBe(252)
      expect(accessSiira.hpAfter).toBe(0)
      expect(accessSiira.reboot).toBe(true)
      expect(accessSiira.exp).toMatchObject({ access: 0, skill: 0 })
    }
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    if (result.defense) {
      // リブート確認
      defense = result.defense
      siira = defense.formation[1]
      expect(siira.currentHp).toBe(252)
      expect(defense.event.length).toBe(2)
      let event = defense.event[1]
      expect(event.type).toBe("reboot")
      if (event.type === "reboot") {
        expect(siira.currentExp).toBe(0 + event.data.exp)
        expect(result.defense?.displayedExp).toBe(0 + event.data.exp)
      }
    }
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
    if (result.defense) {
      // 確率補正の確認
      expect(result.defense.triggeredSkills.length).toBe(1)
      let trigger = result.defense.triggeredSkills[0]
      expect(trigger.name).toBe(hiiru.name)
      expect(trigger.step).toBe("probability_check")
    }
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
    if (result.defense) {
      // アクセス中の状態の確認
      expect(result.defense.triggeredSkills.length).toBe(1)
      let trigger = result.defense.triggeredSkills[0]
      expect(trigger.name).toBe(siira.name)
      expect(trigger.step).toBe("damage_common")
      let accessSiira = result.defense.formation[1]
      expect(accessSiira.damage).not.toBeUndefined()
      expect(accessSiira.damage?.value).toBe(195)
      expect(accessSiira.damage?.attr).toBe(true)
      expect(accessSiira.hpBefore).toBe(252)
      expect(accessSiira.hpAfter).toBe(57)
      expect(accessSiira.reboot).toBe(false)
      expect(accessSiira.exp).toMatchObject({ access: 0, skill: 0 })
      expect(result.defense.displayedExp).toBe(0)
    }
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
    if (result.defense) {
      // アクセス中の状態の確認
      expect(result.defense.triggeredSkills.length).toBe(2)
      let trigger = result.defense.triggeredSkills[0]
      expect(trigger.name).toBe(hiiru.name)
      expect(trigger.step).toBe("probability_check")
      trigger = result.defense.triggeredSkills[1]
      expect(trigger.name).toBe(siira.name)
      expect(trigger.step).toBe("damage_common")
    }
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })
})