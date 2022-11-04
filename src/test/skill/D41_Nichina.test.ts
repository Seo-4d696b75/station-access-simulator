import { minBy } from "lodash"
import { activateSkill, init, initContext, initUser } from "../.."
import { getAccessDenco, getDefense, hasSkillTriggered, startAccess } from "../../core/access/index"
import DencoManager from "../../core/dencoManager"
import { testManualSkill } from "../skillState"

describe("にちなスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "41",
    name: "nichina",
    active: 7200,
    cooldown: 5400,
  })
  
  test("発動あり-守備側(被アクセス)-非先頭", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 10)
    let nichina = DencoManager.getDenco(context, "41", 50, 10)
    let saya = DencoManager.getDenco(context, "8", 80)
    let defense = initUser(context, "とあるマスター", [seria, nichina])
    defense = activateSkill(context, defense, 1)
    nichina = defense.formation[1]
    let offense = initUser(context, "とあるマスター２", [saya])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: nichina.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    // 本人はリブート
    let d = getDefense(result).formation[1]
    expect(d.reboot).toBe(true)
    expect(d.link.length).toBe(0)
    expect(hasSkillTriggered(result.defense, nichina)).toBe(true)
    // 移譲するリンク
    const link = minBy(nichina.link.slice(1, 10), (e) => e.start)!!
    // セリアに移譲
    d = getDefense(result).formation[0]
    expect(d.reboot).toBe(false)
    expect(d.link.length).toBe(1)
    expect(d.link[0]).toMatchObject(link)
    expect(result.defendPercent).toBe(0)
  })

  test("発動あり-守備側(被アクセス)-先頭", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 10)
    let nichina = DencoManager.getDenco(context, "41", 50, 2)
    let saya = DencoManager.getDenco(context, "8", 80)
    let defense = initUser(context, "とあるマスター", [nichina, seria])
    defense = activateSkill(context, defense, 0)
    nichina = defense.formation[0]
    let offense = initUser(context, "とあるマスター２", [saya])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: nichina.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    // 本人はリブート
    let d = getDefense(result).formation[0]
    expect(d.reboot).toBe(true)
    expect(d.link.length).toBe(0)
    expect(hasSkillTriggered(result.defense, nichina)).toBe(true)
    // セリアに移譲
    d = getDefense(result).formation[1]
    expect(d.reboot).toBe(false)
    expect(d.link.length).toBe(1)
    expect(d.link[0]).toMatchObject(nichina.link[1])
    expect(result.defendPercent).toBe(0)
  })

  test("発動なし-守備側(被アクセス)-非リブート", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 10)
    let nichina = DencoManager.getDenco(context, "41", 50, 2)
    let saya = DencoManager.getDenco(context, "8", 1)
    let defense = initUser(context, "とあるマスター", [seria, nichina])
    defense = activateSkill(context, defense, 1)
    nichina = defense.formation[1]
    let offense = initUser(context, "とあるマスター２", [saya])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: nichina.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    // 本人はリブートなし
    let d = getDefense(result).formation[1]
    expect(d.reboot).toBe(false)
    expect(d.link.length).toBe(2)
    expect(hasSkillTriggered(result.defense, nichina)).toBe(false)
    // セリアに移譲なし
    d = getDefense(result).formation[0]
    expect(d.reboot).toBe(false)
    expect(d.link.length).toBe(0)
    expect(result.defendPercent).toBe(0)
  })

  test("発動なし-守備側(被アクセス)-リンク単一", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 10)
    let nichina = DencoManager.getDenco(context, "41", 50, 1)
    let saya = DencoManager.getDenco(context, "8", 80)
    let defense = initUser(context, "とあるマスター", [seria, nichina])
    defense = activateSkill(context, defense, 1)
    nichina = defense.formation[1]
    let offense = initUser(context, "とあるマスター２", [saya])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: nichina.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    // 本人はリブート
    let d = getDefense(result).formation[1]
    expect(d.reboot).toBe(true)
    expect(d.link.length).toBe(0)
    expect(hasSkillTriggered(result.defense, nichina)).toBe(false)
    // セリアに移譲なし
    d = getDefense(result).formation[0]
    expect(d.reboot).toBe(false)
    expect(d.link.length).toBe(0)
    expect(result.defendPercent).toBe(0)
  })

  test("発動なし-守備側(被アクセス)-相手が高レベル", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 80)
    let nichina = DencoManager.getDenco(context, "41", 50, 2)
    let saya = DencoManager.getDenco(context, "8", 80)
    let defense = initUser(context, "とあるマスター", [seria, nichina])
    defense = activateSkill(context, defense, 1)
    nichina = defense.formation[1]
    let offense = initUser(context, "とあるマスター２", [saya])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: nichina.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    // 本人はリブート
    let d = getDefense(result).formation[1]
    expect(d.reboot).toBe(true)
    expect(d.link.length).toBe(0)
    expect(hasSkillTriggered(result.defense, nichina)).toBe(false)
    // セリアに移譲
    d = getDefense(result).formation[0]
    expect(d.reboot).toBe(false)
    expect(d.link.length).toBe(0)
    expect(result.defendPercent).toBe(0)
  })

  test("発動あり-攻撃側(アクセス)-カウンター", () => {
    // カウンターでリブートする場合は単独リンクでも発動あり得る
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 10)
    let nichina = DencoManager.getDenco(context, "41", 50, 1)
    let sheena = DencoManager.getDenco(context, "7", 80, 1)
    context.random.mode = "force"
    let offense = initUser(context, "とあるマスター", [seria, nichina])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [sheena])
    const config = {
      offense: {
        state: offense,
        carIndex: 1
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    // カウンター発動
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(hasSkillTriggered(result.defense, sheena)).toBe(true)
    // 本人はリブート
    d = result.offense.formation[1]
    expect(d.reboot).toBe(true)
    expect(d.link.length).toBe(0)
    expect(hasSkillTriggered(result.offense, nichina)).toBe(true)
    // セリアに移譲
    d = result.offense.formation[0]
    expect(d.reboot).toBe(false)
    expect(d.link.length).toBe(1)
    expect(d.link[0]).toMatchObject(nichina.link[0])
    expect(result.defendPercent).toBe(0)
  })
  // TODO まりかのカンター
})