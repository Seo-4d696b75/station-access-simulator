import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { activateSkill, disactivateSkill, getSkill, hasSkillTriggered, initContext, initUser, startAccess } from "../.."


describe("いずなのスキル", () => {
  test("setup", async () => {
    await StationManager.load()
    await SkillManager.load()
    await DencoManager.load()
    expect(StationManager.data.length).toBeGreaterThan(0)
    expect(SkillManager.map.size).toBeGreaterThan(0)
    expect(DencoManager.data.size).toBeGreaterThan(0)
  })
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
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: reika.link[0],
    }
    const { access } = startAccess(context, config)
    expect(access.offense.triggeredSkills.length).toBe(0)
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
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: charlotte.link[0],
    }
    const { access } = startAccess(context, config)
    expect(access.defense).not.toBeUndefined()
    if (access.defense) {
      expect(access.defense.triggeredSkills.length).toBe(0)
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
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: izuna.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    // 基本的なダメージの確認
    expect(access.defense).not.toBeUndefined()
    expect(hasSkillTriggered(access.defense, izuna)).toBe(true)
    expect(access.defendPercent).toBe(4)
    expect(access.damageBase).toBe(192)
    expect(access.damageRatio).toBe(1.0)
    if (access.defense) {
      // アクセス中の状態の確認
      let accessIzuna = access.defense.formation[0]
      expect(accessIzuna.damage).not.toBeUndefined()
      expect(accessIzuna.damage?.value).toBe(192)
      expect(accessIzuna.damage?.attr).toBe(false)
      expect(accessIzuna.hpBefore).toBe(216)
      expect(accessIzuna.hpAfter).toBe(24)
      expect(accessIzuna.reboot).toBe(false)
      expect(accessIzuna.accessEXP).toBe(0)
    }
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
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
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: izuna.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    // 基本的なダメージの確認
    expect(access.defense).not.toBeUndefined()
    expect(hasSkillTriggered(access.defense, izuna)).toBe(true)
    expect(access.defendPercent).toBe(8)
    expect(access.damageBase).toBe(184)
    expect(access.damageRatio).toBe(1.0)
    if (access.defense) {
      // アクセス中の状態の確認
      let accessIzuna = access.defense.formation[0]
      expect(accessIzuna.damage).not.toBeUndefined()
      expect(accessIzuna.damage?.value).toBe(184)
      expect(accessIzuna.damage?.attr).toBe(false)
      expect(accessIzuna.hpBefore).toBe(216)
      expect(accessIzuna.hpAfter).toBe(32)
      expect(accessIzuna.reboot).toBe(false)
      expect(accessIzuna.accessEXP).toBe(0)
    }
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
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
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: izuna.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    // 基本的なダメージの確認
    expect(access.defense).not.toBeUndefined()
    expect(hasSkillTriggered(access.defense, izuna)).toBe(true)
    expect(access.defendPercent).toBe(15)
    expect(access.damageBase).toBe(170)
    expect(access.damageRatio).toBe(1.0)
    if (access.defense) {
      // アクセス中の状態の確認
      let accessIzuna = access.defense.formation[0]
      expect(accessIzuna.damage).not.toBeUndefined()
      expect(accessIzuna.damage?.value).toBe(170)
      expect(accessIzuna.damage?.attr).toBe(false)
      expect(accessIzuna.hpBefore).toBe(256)
      expect(accessIzuna.hpAfter).toBe(86)
      expect(accessIzuna.reboot).toBe(false)
      expect(accessIzuna.accessEXP).toBe(0)
    }
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
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
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: izuna.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    // 基本的なダメージの確認
    expect(access.defense).not.toBeUndefined()
    expect(hasSkillTriggered(access.defense, izuna)).toBe(true)
    expect(access.defendPercent).toBe(28)
    expect(access.damageBase).toBe(144)
    expect(access.damageRatio).toBe(1.0)
    if (access.defense) {
      // アクセス中の状態の確認
      let accessIzuna = access.defense.formation[0]
      expect(accessIzuna.damage).not.toBeUndefined()
      expect(accessIzuna.damage?.value).toBe(144)
      expect(accessIzuna.damage?.attr).toBe(false)
      expect(accessIzuna.hpBefore).toBe(336)
      expect(accessIzuna.hpAfter).toBe(192)
      expect(accessIzuna.reboot).toBe(false)
      expect(accessIzuna.accessEXP).toBe(0)
    }
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
  })
})