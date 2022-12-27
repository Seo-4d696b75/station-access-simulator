import assert from "assert"
import { activateSkill, getAccessDenco, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import "../../gen/matcher"
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
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.damage?.value).toBeGreaterThan(0)
    expect(d.hpAfter).toBeLessThan(d.maxHp * 0.3)
    expect(hasSkillTriggered(result.defense, kuni)).toBe(true)
    // カウンター発動 みことATK増加が効く
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(true)
    d = getAccessDenco(result, "offense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(Math.floor(180 * 1.12))
    expect(d.hpAfter).toBeLessThan(d.maxHp)
    expect(d.currentHp).toBeLessThan(d.maxHp)
    // 回復
    assert(result.defense)
    expect(result.defense.event.length).toBe(2)
    assert(result.defense.event[0].type === "access")
    let e = result.defense.event[1]
    assert(e.type === "skill_trigger")
    expect(e.data.step).toBe("self")
    expect(e.data.denco).toMatchDenco(kuni)
    d = getAccessDenco(result, "defense")
    // 最大HPの30%
    expect(d.currentHp).toBe(d.hpAfter + Math.floor(d.maxHp * 0.3))
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
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.damage?.value).toBeGreaterThan(0)
    expect(d.hpAfter).toBeLessThan(d.maxHp * 0.3)
    // ひいるの確率補正が効く
    expect(hasSkillTriggered(result.defense, kuni)).toBe(true)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    // カウンター発動 みことATK増加が効く
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(true)
    d = getAccessDenco(result, "offense")
    expect(d.damage).not.toBeUndefined()
    // 回復
    // カウンター発動後ご回復は確定発動(100%)なので確率補正は効かない
    assert(result.defense)
    expect(result.defense.event.length).toBe(2)
    assert(result.defense.event[0].type === "access")
    let e = result.defense.event[1]
    assert(e.type === "skill_trigger")
    expect(e.data.step).toBe("self")
    expect(e.data.denco).toMatchDenco(kuni)
    d = getAccessDenco(result, "defense")
    // 最大HPの30%
    expect(d.currentHp).toBe(d.hpAfter + Math.floor(d.maxHp * 0.3))
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

  describe("まりかカウンター", () => {
    test("リブートなし", () => {

      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let mikoto = DencoManager.getDenco(context, "37", 50, 1)
      let kuni = DencoManager.getDenco(context, "38", 50)
      kuni.ap = 200
      kuni.maxHp = 400
      kuni.currentHp = 400
      let marika = DencoManager.getDenco(context, "58", 40)
      let defense = initUser(context, "とあるマスター", [mikoto, kuni])
      defense = activateSkill(context, defense, 1)
      let offense = initUser(context, "とあるマスター２", [marika])
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
        station: mikoto.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      let d = getAccessDenco(result, "defense")
      expect(d.reboot).toBe(false)
      expect(d.damage?.value).toBeGreaterThan(0)
      expect(d.hpAfter).toBeLessThan(d.maxHp * 0.3)
      expect(hasSkillTriggered(result.defense, kuni)).toBe(true)
      // くにのカウンター発動 みことATK増加が効く
      expect(hasSkillTriggered(result.defense, mikoto)).toBe(true)
      d = getAccessDenco(result, "offense")
      expect(d.damage).not.toBeUndefined()
      const damage = Math.floor(200 * 1.12 * 1.3)
      expect(d.damage?.value).toBe(damage)
      expect(d.hpAfter).toBe(0)
      expect(d.reboot).toBe(true)
      // まりかカウンター発動
      expect(hasSkillTriggered(result.offense, marika)).toBe(true)
      assert(result.defense)
      // くににダメージ発生
      d = result.defense.formation[1]
      expect(d.damage).not.toBeUndefined()
      expect(d.damage?.value).toBe(damage)
      expect(d.reboot).toBe(false)
      // 回復
      assert(result.defense)
      expect(result.defense.event.length).toBe(2)
      assert(result.defense.event[0].type === "access")
      let e = result.defense.event[1]
      assert(e.type === "skill_trigger")
      expect(e.data.step).toBe("self")
      expect(e.data.denco).toMatchDenco(kuni)
      d = getAccessDenco(result, "defense")
      // 最大HPの30%
      expect(d.currentHp).toBe(d.hpAfter + Math.floor(d.maxHp * 0.3))
    })
    test("リブートあり", () => {

      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let mikoto = DencoManager.getDenco(context, "37", 50, 1)
      let kuni = DencoManager.getDenco(context, "38", 50, 1)
      kuni.ap = 200
      kuni.currentHp = 10
      kuni.nextExp = Number.MAX_SAFE_INTEGER
      let marika = DencoManager.getDenco(context, "58", 40)
      let defense = initUser(context, "とあるマスター", [mikoto, kuni])
      defense = activateSkill(context, defense, 1)
      let offense = initUser(context, "とあるマスター２", [marika])
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
        station: mikoto.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      let d = getAccessDenco(result, "defense")
      expect(d.reboot).toBe(false)
      expect(d.damage?.value).toBeGreaterThan(0)
      expect(d.hpAfter).toBeLessThan(d.maxHp * 0.3)
      expect(hasSkillTriggered(result.defense, kuni)).toBe(true)
      // くにのカウンター発動 みことATK増加が効く
      expect(hasSkillTriggered(result.defense, mikoto)).toBe(true)
      d = getAccessDenco(result, "offense")
      expect(d.damage).not.toBeUndefined()
      const damage = Math.floor(200 * 1.12 * 1.3)
      expect(d.damage?.value).toBe(damage)
      expect(d.hpAfter).toBe(0)
      expect(d.reboot).toBe(true)
      // まりかカウンター発動
      expect(hasSkillTriggered(result.offense, marika)).toBe(true)
      assert(result.defense)
      // くににダメージ発生
      d = result.defense.formation[1]
      expect(d.damage).not.toBeUndefined()
      expect(d.damage?.value).toBe(damage)
      // FIXME ゲーム動作だと何故かダメージ受けない＆リブートしない＆リンク解除しない
      // 情報が少ないので最新の情報かもやや疑わしい
      expect(d.reboot).toBe(true)
      expect(d.disconnectedLink).not.toBeUndefined()
      expect(d.link.length).toBe(0)
      // くにリブート＆みこと回復
      assert(result.defense)
      expect(result.defense.event.length).toBe(3)
      assert(result.defense.event[0].type === "access")
      let e = result.defense.event[1]
      assert(e.type === "reboot")
      expect(e.data.denco).toMatchDenco(kuni)
      e = result.defense.event[2]
      assert(e.type === "skill_trigger")
      expect(e.data.step).toBe("self")
      expect(e.data.denco).toMatchDenco(kuni)
      d = getAccessDenco(result, "defense")
      // 最大HPの30%
      expect(d.currentHp).toBe(d.hpAfter + Math.floor(d.maxHp * 0.3))
    })
  })
})