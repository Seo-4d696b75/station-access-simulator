import assert from "assert"
import { hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import { testAlwaysSkill } from "../tool/skillState"


describe("いずなのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "13",
    name: "izuna"
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
    expect(result.skillTriggers.length).toBe(0)
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
    expect(result.skillTriggers.length).toBe(0)
  })
  test.each([1, 2, 3, 4])("発動あり-ディフェンダーx%d", (cnt) => {
    const context = initContext("test", "test", false)
    let izuna = DencoManager.getDenco(context, "13", 80, 1)
    let luna = DencoManager.getDenco(context, "3", 50)
    let siira = DencoManager.getDenco(context, "11", 50)
    let mobo = DencoManager.getDenco(context, "12", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [izuna, luna, siira, mobo].slice(0, cnt))
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
    expect(hasSkillTriggered(result, "defense", izuna)).toBe(true)
    const def = 7 * cnt
    expect(result.defendPercent).toBe(def)
    const damage = Math.floor(reika.ap * (100 - def) / 100)
    expect(result.damageBase?.variable).toBe(damage)
    expect(result.damageRatio).toBe(1.0)
    assert(result.defense)
    // アクセス中の状態の確認
    let accessIzuna = result.defense.formation[0]
    expect(accessIzuna.damage).not.toBeUndefined()
    expect(accessIzuna.damage?.value).toBe(damage)
    expect(accessIzuna.damage?.attr).toBe(false)
    expect(accessIzuna.hpBefore).toBe(336)
    expect(accessIzuna.hpAfter).toBe(336 - damage)
    expect(accessIzuna.reboot).toBe(false)
    expect(accessIzuna.exp.total).toBe(0)
    expect(result.defense.displayedExp).toBe(0)

    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })
})