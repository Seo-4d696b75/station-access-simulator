import { activateSkill, disactivateSkill, getSkill, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"


describe("いずなのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let izuna = DencoManager.getDenco(context, "13", 50)
    let state = initUser(context, "master", [izuna])
    izuna = state.formation[0]
    expect(izuna.name).toBe("izuna")
    expect(izuna.skill.type).toBe("possess")
    let skill = getSkill(izuna)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")
    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => disactivateSkill(context, state, 0)).toThrowError()
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    let izuna = DencoManager.getDenco(context, "13", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [izuna])
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
    let izuna = DencoManager.getDenco(context, "13", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [charlotte, izuna])
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
  test("発動あり-ディフェンダー1", () => {
    const context = initContext("test", "test", false)
    let izuna = DencoManager.getDenco(context, "13", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [izuna])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: izuna.link[0],
    }
    const result = startAccess(context, config)
    // 基本的なダメージの確認
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, izuna)).toBe(true)
    expect(result.defendPercent).toBe(4)
    expect(result.damageBase?.variable).toBe(192)
    expect(result.damageRatio).toBe(1.0)
    if (result.defense) {
      // アクセス中の状態の確認
      let accessIzuna = result.defense.formation[0]
      expect(accessIzuna.damage).not.toBeUndefined()
      expect(accessIzuna.damage?.value).toBe(192)
      expect(accessIzuna.damage?.attr).toBe(false)
      expect(accessIzuna.hpBefore).toBe(216)
      expect(accessIzuna.hpAfter).toBe(24)
      expect(accessIzuna.reboot).toBe(false)
      expect(accessIzuna.exp).toMatchObject({ access: 0, skill: 0 })
      expect(result.defense.displayedExp).toBe(0)
    }
    expect(result.linkDisconncted).toBe(false)
    expect(result.linkSuccess).toBe(false)
    if (result.defense) {
      // リブート確認
      defense = result.defense
      izuna = defense.formation[0]
      expect(izuna.currentHp).toBe(24)
    }

  })
  test("発動あり-ディフェンダー2", () => {
    const context = initContext("test", "test", false)
    let izuna = DencoManager.getDenco(context, "13", 50, 1)
    let luna = DencoManager.getDenco(context, "3", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [izuna, luna])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: izuna.link[0],
    }
    const result = startAccess(context, config)
    // 基本的なダメージの確認
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, izuna)).toBe(true)
    expect(result.defendPercent).toBe(8)
    expect(result.damageBase?.variable).toBe(184)
    expect(result.damageRatio).toBe(1.0)
    if (result.defense) {
      // アクセス中の状態の確認
      let accessIzuna = result.defense.formation[0]
      expect(accessIzuna.damage).not.toBeUndefined()
      expect(accessIzuna.damage?.value).toBe(184)
      expect(accessIzuna.damage?.attr).toBe(false)
      expect(accessIzuna.hpBefore).toBe(216)
      expect(accessIzuna.hpAfter).toBe(32)
      expect(accessIzuna.reboot).toBe(false)
      expect(accessIzuna.exp).toMatchObject({ access: 0, skill: 0 })
      expect(result.defense.displayedExp).toBe(0)
    }
    expect(result.linkDisconncted).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })
  test("発動あり-ディフェンダー3", () => {
    const context = initContext("test", "test", false)
    let izuna = DencoManager.getDenco(context, "13", 60, 1)
    let luna = DencoManager.getDenco(context, "3", 50)
    let siira = DencoManager.getDenco(context, "11", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [izuna, luna, siira])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: izuna.link[0],
    }
    const result = startAccess(context, config)
    // 基本的なダメージの確認
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, izuna)).toBe(true)
    expect(result.defendPercent).toBe(15)
    expect(result.damageBase?.variable).toBe(170)
    expect(result.damageRatio).toBe(1.0)
    if (result.defense) {
      // アクセス中の状態の確認
      let accessIzuna = result.defense.formation[0]
      expect(accessIzuna.damage).not.toBeUndefined()
      expect(accessIzuna.damage?.value).toBe(170)
      expect(accessIzuna.damage?.attr).toBe(false)
      expect(accessIzuna.hpBefore).toBe(256)
      expect(accessIzuna.hpAfter).toBe(86)
      expect(accessIzuna.reboot).toBe(false)
      expect(accessIzuna.exp).toMatchObject({ access: 0, skill: 0 })
      expect(result.defense.displayedExp).toBe(0)
    }
    expect(result.linkDisconncted).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })
  test("発動あり-ディフェンダー4", () => {
    const context = initContext("test", "test", false)
    let izuna = DencoManager.getDenco(context, "13", 80, 1)
    let luna = DencoManager.getDenco(context, "3", 50)
    let siira = DencoManager.getDenco(context, "11", 50)
    let mobo = DencoManager.getDenco(context, "12", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [izuna, luna, siira, mobo])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: izuna.link[0],
    }
    const result = startAccess(context, config)
    // 基本的なダメージの確認
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, izuna)).toBe(true)
    expect(result.defendPercent).toBe(28)
    expect(result.damageBase?.variable).toBe(144)
    expect(result.damageRatio).toBe(1.0)
    if (result.defense) {
      // アクセス中の状態の確認
      let accessIzuna = result.defense.formation[0]
      expect(accessIzuna.damage).not.toBeUndefined()
      expect(accessIzuna.damage?.value).toBe(144)
      expect(accessIzuna.damage?.attr).toBe(false)
      expect(accessIzuna.hpBefore).toBe(336)
      expect(accessIzuna.hpAfter).toBe(192)
      expect(accessIzuna.reboot).toBe(false)
      expect(accessIzuna.exp).toMatchObject({ access: 0, skill: 0 })
      expect(result.defense.displayedExp).toBe(0)
    }
    expect(result.linkDisconncted).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })
})