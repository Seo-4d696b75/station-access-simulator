import assert from "assert"
import dayjs from "dayjs"
import { init } from "../.."
import { getAccessDenco, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { testAlwaysSkill } from "../tool/skillState"

describe("みろくのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "4",
    name: "miroku"
  })

  test("発動なし-フットバース使用", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [miroku])
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
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.pinkItemSet).toBe(true)
    expect(result.pinkItemUsed).toBe(true)
    expect(result.pinkMode).toBe(true)
    expect(hasSkillTriggered(result, "offense", miroku)).toBe(false)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(false)
  })
  test("発動なし-守備側", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [miroku])
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
      station: miroku.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(hasSkillTriggered(result, "defense", miroku)).toBe(false)
  })
  test("発動なし-攻撃側編成内", () => {
    const context = initContext("test", "test", false)
    context.clock = dayjs('2022-01-01T23:00:00+0900').valueOf()
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [reika, miroku])
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
    expect(hasSkillTriggered(result, "offense", miroku)).toBe(false)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [miroku])
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
    expect(hasSkillTriggered(result, "offense", miroku)).toBe(false)
    let trigger = getSkillTrigger(result, "offense", miroku)[0]
    expect(trigger.probability).toBe(3.5)
    expect(trigger.probability).toBe(3.5)
    expect(trigger.canTrigger).toBe(false)
    expect(trigger.invalidated).toBe(false)
    expect(trigger.triggered).toBe(false)
  })
  test("発動あり-Rebootなし", () => {
    // 発動の通常
    const context = initContext("test", "test", false)
    context.clock = dayjs('2022-01-01T23:00:00+0900').valueOf()
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 80, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [miroku])
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
    expect(hasSkillTriggered(result, "offense", miroku)).toBe(true)
    let trigger = getSkillTrigger(result, "offense", miroku)[0]
    expect(trigger.denco).toMatchDenco(miroku)
    expect(trigger.denco.carIndex).toBe(0)
    expect(trigger.denco.which).toBe("offense")
    expect(trigger.denco.who).toBe("offense")
    expect(trigger.probability).toBe(3.5)
    expect(trigger.probability).toBe(3.5)
    expect(trigger.canTrigger).toBe(true)
    expect(trigger.invalidated).toBe(false)
    expect(trigger.triggered).toBe(true)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.damageBase?.variable).toBe(95)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(false)
    expect(accessLuna.hpBefore).toBe(360)
    expect(accessLuna.hpAfter).toBe(170)
    expect(accessLuna.damage?.value).toBe(190)
  })
  test("発動あり-ひいる", () => {
    const context = initContext("test", "test", false)
    context.clock = dayjs('2022-01-01T23:00:00+0900').valueOf()
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 80, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [miroku, hiiru])
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
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    // ひいるによる確率ブーストが乗る
    expect(hasSkillTriggered(result, "offense", miroku)).toBe(true)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    let trigger = getSkillTrigger(result, "offense", miroku)[0]
    assert(trigger)
    expect(trigger.probability).toBe(3.5)
    expect(trigger.boostedProbability).toBe(3.5 * 1.2)
    expect(trigger.canTrigger).toBe(true)
    expect(trigger.invalidated).toBe(false)
    expect(trigger.triggered).toBe(true)
  })
  test("発動あり-Rebootあり", () => {
    const context = initContext("test", "test", false)
    context.clock = dayjs('2022-01-01T12:00:00+0900').valueOf()
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 80, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [miroku])
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
    expect(hasSkillTriggered(result, "offense", miroku)).toBe(true)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.damageBase?.variable).toBe(247)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(true)
    expect(accessLuna.hpBefore).toBe(360)
    expect(accessLuna.hpAfter).toBe(0)
    expect(accessLuna.damage?.value).toBe(494)
  })
  test("発動あり-サポータAKT上昇", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    context.clock = dayjs('2022-01-01T23:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 80, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [miroku, reika])
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
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(hasSkillTriggered(result, "offense", miroku)).toBe(true)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(true)
    expect(hasSkillTriggered(result, "defense", luna)).toBe(true)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.attackPercent).toBe(25)
    expect(result.defendPercent).toBe(50)
    expect(result.damageBase?.variable).toBe(142)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(false)
    expect(accessLuna.hpBefore).toBe(360)
    expect(accessLuna.hpAfter).toBe(76)
    expect(accessLuna.damage?.value).toBe(284)
  })
  test("発動なし-１回で相手をリブート", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    context.clock = dayjs('2022-01-01T12:00:00+0900').valueOf()
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [luna])
    let offense = initUser(context, "とあるマスター２", [miroku, reika])
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
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(hasSkillTriggered(result, "offense", miroku)).toBe(false)
    let accessLuna = getAccessDenco(result, "defense")
    expect(accessLuna.reboot).toBe(true)
    expect(accessLuna.hpBefore).toBe(240)
    expect(accessLuna.hpAfter).toBe(0)
    expect(accessLuna.damage?.value).toBe(294)
  })
})