import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getAccessDenco, getSkill, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import { getFixedDamageDenco } from "../fake"

describe("るるのスキル", () => {
  beforeAll(init)

  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let lulu = DencoManager.getDenco(context, "39", 50)
    expect(lulu.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [lulu])
    const now = moment().valueOf()
    context.clock = now
    lulu = defense.formation[0]
    expect(lulu.name).toBe("lulu")
    let skill = getSkill(lulu)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
    expect(() => activateSkill(context, defense, 0)).toThrowError()
  })
  test("発動あり-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let lulu = DencoManager.getDenco(context, "39", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [lulu, seria])
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
      station: lulu.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, lulu)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(0)
  })
  test("発動あり-守備側(被アクセス)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let lulu = DencoManager.getDenco(context, "39", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [lulu, hiiru])
    defense = activateSkill(context, defense, 1)
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
      station: lulu.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, lulu)).toBe(true)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(0)
  })
  test("発動なし-守備側(被アクセス)-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let lulu = DencoManager.getDenco(context, "39", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [lulu, hiiru])
    defense = activateSkill(context, defense, 1)
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
      station: lulu.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, lulu)).toBe(false)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBeGreaterThan(0)
  })
  test("発動なし-守備側(被アクセス)-HP最大未満", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let lulu = DencoManager.getDenco(context, "39", 50, 1)
    lulu.currentHp = lulu.maxHp - 1
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [lulu, hiiru])
    defense = activateSkill(context, defense, 1)
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
      station: lulu.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, lulu)).toBe(false)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(false)
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBeGreaterThan(0)
  })
  test("発動なし-守備側(編成内)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let lulu = DencoManager.getDenco(context, "39", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [hiiru, lulu])
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
      station: hiiru.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, lulu)).toBe(false)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(false)
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBeGreaterThan(0)
  })

  test("発動あり-守備側(被アクセス)-固定ダメージ追加", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let lulu = DencoManager.getDenco(context, "39", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let test = getFixedDamageDenco(10)
    let defense = initUser(context, "とあるマスター", [lulu, seria])
    let offense = initUser(context, "とあるマスター２", [charlotte, test])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: lulu.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, lulu)).toBe(true)
    expect(hasSkillTriggered(result.offense, test)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(10)
    expect(d.hpAfter).toBe(d.hpBefore - 10)
  })

  test("発動あり-守備側(被アクセス)-固定ダメージ追加vs軽減", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let lulu = DencoManager.getDenco(context, "39", 50, 1)
    let test1 = getFixedDamageDenco(-20)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let test2 = getFixedDamageDenco(10)
    let defense = initUser(context, "とあるマスター", [lulu, test1])
    let offense = initUser(context, "とあるマスター２", [charlotte, test2])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: lulu.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, lulu)).toBe(true)
    expect(hasSkillTriggered(result.defense, test1)).toBe(true)
    expect(hasSkillTriggered(result.offense, test2)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(0)
  })

  test("発動なし-守備側(被アクセス)-無効化", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let lulu = DencoManager.getDenco(context, "39", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let ren = DencoManager.getDenco(context, "22", 50)
    let defense = initUser(context, "とあるマスター", [lulu, hiiru])
    let offense = initUser(context, "とあるマスター２", [ren])
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
      station: lulu.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, lulu)).toBe(false)
    expect(hasSkillTriggered(result.offense, ren)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBeGreaterThan(0)
    expect(d.skillInvalidated).toBe(true)
  })
  test("発動あり-守備側(被アクセス)-チコ相手", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let lulu = DencoManager.getDenco(context, "39", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let chiko = DencoManager.getDenco(context, "29", 50)
    let defense = initUser(context, "とあるマスター", [lulu, hiiru])
    let offense = initUser(context, "とあるマスター２", [chiko])
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
      station: lulu.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, lulu)).toBe(true)
    expect(hasSkillTriggered(result.offense, chiko)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(d.maxHp)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(d.maxHp)
  })
  test("発動あり-守備側(被アクセス)-チコ相手はダメージ軽減効かないぞ！", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let lulu = DencoManager.getDenco(context, "39", 50, 1)
    let test = getFixedDamageDenco(-10)
    let chiko = DencoManager.getDenco(context, "29", 50)
    let defense = initUser(context, "とあるマスター", [lulu, test])
    let offense = initUser(context, "とあるマスター２", [chiko])
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
      station: lulu.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, lulu)).toBe(true)
    expect(hasSkillTriggered(result.defense, test)).toBe(true)
    expect(hasSkillTriggered(result.offense, chiko)).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(d.maxHp)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(d.maxHp)
  })
})