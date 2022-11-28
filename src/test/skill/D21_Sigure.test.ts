import { DencoManager, init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import { activateSkill, getSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../tool/skillState"

describe("しぐれのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "21",
    name: "sigure"
  })

  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    let sigure = DencoManager.getDenco(context, "21", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [charlotte, sigure])
    sigure = offense.formation[1]
    expect(getSkill(sigure).transition.state).toBe("active")
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, sigure)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-守備側-被アクセス", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let sigure = DencoManager.getDenco(context, "21", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [sigure])
    let offense = initUser(context, "とあるマスター２", [reika])
    sigure = defense.formation[0]
    expect(getSkill(sigure).transition.state).toBe("active")
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: sigure.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, sigure)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let saya = DencoManager.getDenco(context, "8", 50, 1)
    let sigure = DencoManager.getDenco(context, "21", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [saya, sigure])
    let offense = initUser(context, "とあるマスター２", [reika])
    sigure = defense.formation[1]
    expect(getSkill(sigure).transition.state).toBe("active")
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: saya.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, sigure)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let saya = DencoManager.getDenco(context, "8", 50, 1)
    let sigure = DencoManager.getDenco(context, "21", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [saya, sigure])
    let offense = initUser(context, "とあるマスター２", [reika])
    sigure = defense.formation[1]
    expect(getSkill(sigure).transition.state).toBe("active")
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: saya.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, sigure)).toBe(true)
    expect(result.defendPercent).toBe(17)
    let accessSaya = getAccessDenco(result, "defense")
    expect(accessSaya.damage).not.toBeUndefined()
    expect(accessSaya.damage?.value).toBe(166)
    expect(accessSaya.damage?.attr).toBe(false)
    expect(result.damageBase).not.toBeUndefined()
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageBase?.variable).toBe(166)
  })
  test("発動なし-非アタッカー", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let sigure = DencoManager.getDenco(context, "21", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, sigure])
    let offense = initUser(context, "とあるマスター２", [reika])
    sigure = defense.formation[1]
    expect(getSkill(sigure).transition.state).toBe("active")
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
    expect(hasSkillTriggered(result.defense, sigure)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動あり-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let saya = DencoManager.getDenco(context, "8", 50, 1)
    let sigure = DencoManager.getDenco(context, "21", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [saya, sigure, hiiru])
    let offense = initUser(context, "とあるマスター２", [reika])
    defense = activateSkill(context, defense, 2)
    sigure = defense.formation[1]
    expect(getSkill(sigure).transition.state).toBe("active")
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: saya.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    expect(hasSkillTriggered(result.defense, sigure)).toBe(true)
    expect(result.defendPercent).toBe(17)
    expect(result.damageBase).not.toBeUndefined()
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageBase?.variable).toBe(166)
  })
  test("発動なし-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let saya = DencoManager.getDenco(context, "8", 50, 1)
    let sigure = DencoManager.getDenco(context, "21", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [saya, sigure, hiiru])
    let offense = initUser(context, "とあるマスター２", [reika])
    defense = activateSkill(context, defense, 2)
    sigure = defense.formation[1]
    expect(getSkill(sigure).transition.state).toBe("active")
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: saya.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    expect(hasSkillTriggered(result.defense, sigure)).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.damageBase).not.toBeUndefined()
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageBase?.variable).toBe(200)
  })
})