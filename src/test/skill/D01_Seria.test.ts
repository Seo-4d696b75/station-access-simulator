import assert from "assert"
import { init } from "../.."
import { getAccessDenco, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { getFixedDamageDenco } from "../tool/fake"
import "../tool/matcher"
import { testManualSkill } from "../tool/skillState"

describe("セリアのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "1",
    name: "seria",
    active: 1800,
    cooldown: 10800,
  })

  test("発動なし-HP30%以下なし", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 10)
    let defense = initUser(context, "とあるマスター", [reika, seria])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    assert(result.defense)
    let d = result.defense.formation[0]
    expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
    expect(d.hpAfter).toBeGreaterThan(d.maxHp * 0.3)
    expect(d.hpAfter).toBe(d.currentHp)
    expect(result.defense.event.length).toBe(1)
  })
  test("発動なし-HP変化なし", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    reika.currentHp = Math.floor(reika.maxHp * 0.3)
    let test = getFixedDamageDenco(-1000)
    let charlotte = DencoManager.getDenco(context, "6", 10)
    let defense = initUser(context, "とあるマスター", [reika, seria, test])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    assert(result.defense)
    let d = result.defense.formation[0]
    expect(d.hpAfter).toBe(d.hpBefore)
    expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.3)
    expect(d.currentHp).toBe(d.hpAfter)
    expect(result.defense.event.length).toBe(1)
  })
  test("発動なし-Reboot", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [reika, seria])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    const d = getAccessDenco(result, "defense")
    expect(d.hpAfter).toBe(0)
    expect(d.reboot).toBe(true)
    expect(d.currentHp).toBe(d.maxHp)
    assert(result.defense)
    expect(result.defense.event.length).toBe(2)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika, seria])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    const d = getAccessDenco(result, "defense")
    expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBeLessThanOrEqual(d.maxHp * 0.3)
    assert(result.defense)
    expect(result.defense.event.length).toBe(1)
  })
  test("発動あり-守備側（編成内）", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika, seria])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    const d = getAccessDenco(result, "defense")
    expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
    expect(d.reboot).toBe(false)
    expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.3)
    assert(result.defense)
    const heal = Math.floor(d.maxHp * 0.45)
    expect(d.currentHp).toBe(d.hpAfter + heal)
    expect(result.defense.event.length).toBe(2)
    const e = result.defense.event[1]
    assert(e.type === "skill_trigger")
    expect(e.data.time).toBe(result.time)
    expect(e.data.carIndex).toBe(1)
    expect(e.data.skillName).toBe("検測開始しま～す♡ Lv.4")
    expect(e.data.step).toBe("self")
    expect(e.data.denco).toMatchDencoState(result.defense.formation[1])
  })
  test("発動あり-守備側（編成内）-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika, seria, hiiru])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    const d = getAccessDenco(result, "defense")
    expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
    expect(d.reboot).toBe(false)
    expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.3)
    assert(result.defense)
    const heal = Math.floor(d.maxHp * 0.45)
    expect(d.currentHp).toBe(d.hpAfter + heal)
    expect(result.defense.event.length).toBe(3)
    let e = result.defense.event[1]
    assert(e.type === "skill_trigger")
    expect(e.data.time).toBe(result.time)
    expect(e.data.carIndex).toBe(2)
    expect(e.data.skillName).toBe("テンションAGEAGE↑↑ Lv.4")
    expect(e.data.step).toBe("probability_check")
    expect(e.data.denco).toMatchDencoState(result.defense.formation[2])
    e = result.defense.event[2]
    assert(e.type === "skill_trigger")
    expect(e.data.time).toBe(result.time)
    expect(e.data.carIndex).toBe(1)
    expect(e.data.skillName).toBe("検測開始しま～す♡ Lv.4")
    expect(e.data.step).toBe("self")
    expect(e.data.denco).toMatchDencoState(result.defense.formation[1])
  })
  test("発動なし-守備側（編成内）-無効化", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let chitose = DencoManager.getDenco(context, "61", 50)
    let defense = initUser(context, "とあるマスター", [reika, seria])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [charlotte, chitose])
    offense = activateSkill(context, offense, 1)
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
    let d = getAccessDenco(result, "defense")
    expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
    expect(d.reboot).toBe(false)
    expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.3)
    assert(result.defense)
    expect(d.currentHp).toBe(d.hpAfter)
    d = result.defense.formation[1]
    expect(d.skillInvalidated).toBe(true)
    expect(result.defense.event.length).toBe(1)
  })
  test("発動あり-攻撃側（編成内）-カウンターあり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, seria])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [sheena])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    const d = result.offense.formation[0]
    expect(d.hpAfter).toBe(d.maxHp - sheena.ap)
    expect(d.reboot).toBe(false)
    expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.3)
    const heal = Math.floor(d.maxHp * 0.45)
    expect(d.currentHp).toBe(d.hpAfter + heal)
    expect(result.offense.event.length).toBe(2)
    const e = result.offense.event[1]
    assert(e.type === "skill_trigger")
    expect(e.data.time).toBe(result.time)
    expect(e.data.carIndex).toBe(1)
    expect(e.data.skillName).toBe("検測開始しま～す♡ Lv.4")
    expect(e.data.step).toBe("self")
    expect(e.data.denco).toMatchDencoState(result.offense.formation[1])
  })
})