import { activateSkill, init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../skillState"

describe("まりかのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "58",
    name: "marika",
    active: 5400,
    cooldown: 7200,
  })

  test("発動あり-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let marika = DencoManager.getDenco(context, "58", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [marika, seria])
    defense = activateSkill(context, defense, 0)
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
      station: marika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, marika)).toBe(true)
    // reboot
    const self = getAccessDenco(result, "defense")
    expect(self.damage).not.toBeUndefined()
    expect(self.reboot).toBe(true)
    // 相手
    const d = getAccessDenco(result, "offense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(self.damage?.value)
    expect(d.damage?.value).toBeGreaterThan(d.maxHp)
    expect(d.reboot).toBe(true)
    expect(result.linkSuccess).toBe(false)
  })
  test("発動なし-守備側(被アクセス)-足湯", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let marika = DencoManager.getDenco(context, "58", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [marika, seria])
    defense = activateSkill(context, defense, 0)
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
      station: marika.link[0],
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, marika)).toBe(false)
    // reboot
    const self = getAccessDenco(result, "defense")
    expect(self.damage).toBeUndefined()
    expect(self.reboot).toBe(false)
    // 相手
    const d = getAccessDenco(result, "offense")
    expect(d.damage).toBeUndefined()
    expect(d.reboot).toBe(false)
    expect(result.linkSuccess).toBe(true)
  })
  test("発動あり-攻撃側(アクセス)-シーナのカウンター", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let marika = DencoManager.getDenco(context, "58", 50)
    let sheena = DencoManager.getDenco(context, "7", 80, 1)
    let offense = initUser(context, "とあるマスター", [marika, seria])
    offense = activateSkill(context, offense, 0)
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, sheena)).toBe(true)
    expect(hasSkillTriggered(result.offense, marika)).toBe(true)
    // 攻撃側まりか カウンターのダメージ
    const self = getAccessDenco(result, "offense")
    expect(self.damage).not.toBeUndefined()
    expect(self.damage?.value).toBe(sheena.ap)
    expect(self.reboot).toBe(true)
    // 守備側シーナ まりかのアクセス＋スキルのカウンター
    const d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(Math.floor(1.3 * marika.ap) + sheena.ap)
    expect(d.reboot).toBe(true)

    expect(result.linkSuccess).toBe(false)
    expect(result.linkDisconnected).toBe(true)
  })
})