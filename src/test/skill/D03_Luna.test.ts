import moment from "moment-timezone"
import { init } from "../.."
import { getAccessDenco, getDefense, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../skillState"

describe("ルナのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "3",
    name: "luna",
    time: [
      moment('2022-01-01T12:00:00+0900').valueOf(),
      moment('2022-01-01T23:00:00+0900').valueOf()
    ]
  })

  test("発動なし-フットバース使用", () => {
    const context = initContext("test", "test", false)
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: luna.link[0],
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.pinkItemSet).toBe(true)
    expect(result.pinkItemUsed).toBe(true)
    expect(result.pinkMode).toBe(true)
    expect(result.defense?.triggeredSkills.length).toBe(0)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(false)
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [luna])
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
    expect(result.pinkMode).toBe(false)
    expect(result.offense.triggeredSkills.length).toBe(0)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    let accessReika = getAccessDenco(result, "defense")
    expect(accessReika.reboot).toBe(false)
    expect(accessReika.hpBefore).toBe(192)
    expect(accessReika.hpAfter).toBe(36)
    expect(accessReika.damage?.value).toBe(156)
  })
  test("発動あり-夜", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(result.defense?.triggeredSkills.length).toBe(1)
    let trigger = getDefense(result).triggeredSkills[0]
    expect(trigger.numbering).toBe("3")
    expect(trigger.name).toBe("luna")
    expect(trigger.step).toBe("damage_common")
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(25)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(false)
    expect(accessLuna.hpBefore).toBe(240)
    expect(accessLuna.hpAfter).toBe(90)
    expect(accessLuna.damage?.value).toBe(150)
  })
  test("発動あり-昼", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(result.defense?.triggeredSkills.length).toBe(1)
    let trigger = getDefense(result).triggeredSkills[0]
    expect(trigger.numbering).toBe("3")
    expect(trigger.name).toBe("luna")
    expect(trigger.step).toBe("damage_common")
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(-30)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(true)
    expect(accessLuna.hpBefore).toBe(240)
    expect(accessLuna.hpAfter).toBe(0)
    expect(accessLuna.damage?.value).toBe(260)
  })
})