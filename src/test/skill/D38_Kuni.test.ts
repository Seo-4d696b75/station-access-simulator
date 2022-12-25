import { activateSkill, getAccessDenco, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import { testManualSkill } from "../tool/skillState"

describe("くにのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "38",
    name: "kuni",
    active: 1800,
    cooldown: 7200,
  })

  test("発動あり-守備側(編成内)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let kuni = DencoManager.getDenco(context, "38", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [mikoto, kuni])
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    // みことのダメージ量 = シャルのAP 170 - 回復量 196 * 0.3
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.damage?.value).toBe(170 - Math.floor(196 * 0.3))
    expect(hasSkillTriggered(result.defense, kuni)).toBe(true)
    // カウンター発動 くにAP 180 * (1 + みことATK12%)
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(true)
    d = getAccessDenco(result, "offense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(Math.floor(180 * 1.12))
    expect(d.maxHp).toBe(228)
    expect(d.hpAfter).toBe(228 - 201)
    expect(d.currentHp).toBe(228 - 201)
  })
  test("発動あり-守備側(編成内)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let kuni = DencoManager.getDenco(context, "38", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [mikoto, kuni, hiiru])
    defense = activateSkill(context, defense, 1, 2)
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, kuni)).toBe(true)
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(true)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    let d = getAccessDenco(result, "offense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBeGreaterThan(0)
  })

  test("発動あり（カウンターのみ）-守備側(編成内)-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let kuni = DencoManager.getDenco(context, "38", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [mikoto, kuni])
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    // カウンターは確定
    expect(hasSkillTriggered(result.defense, kuni)).toBe(true)
    // 回復は確率依存
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(false)
    let d = getAccessDenco(result, "offense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBeGreaterThan(0)
  })
  test("発動なし-守備側(編成内)-HP30%より大", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let kuni = DencoManager.getDenco(context, "38", 50)
    let charlotte = DencoManager.getDenco(context, "6", 10)
    let defense = initUser(context, "とあるマスター", [mikoto, kuni])
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.hpAfter).toBeGreaterThan(d.maxHp * 0.3)
    expect(hasSkillTriggered(result.defense, kuni)).toBe(false)
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(false)
    d = getAccessDenco(result, "offense")
    expect(d.damage).toBeUndefined()
  })
  test("発動なし-守備側(編成内)-リブート", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let kuni = DencoManager.getDenco(context, "38", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [mikoto, kuni])
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBeGreaterThan(d.maxHp)
    expect(d.reboot).toBe(true)
    expect(hasSkillTriggered(result.defense, kuni)).toBe(false)
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(false)
    d = getAccessDenco(result, "offense")
    expect(d.damage).toBeUndefined()
  })

  // TODO まりかカウンター
  // TODO まりかカウンターでリブートしたときフィルム補正
})