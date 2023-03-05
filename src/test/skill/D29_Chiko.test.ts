import { init } from "../.."
import { getAccessDenco, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { getFixedDamageDenco } from "../tool/fake"
import { testManualSkill } from "../tool/skillState"

describe("チコのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "29",
    name: "chiko",
    active: 600,
    cooldown: 10800,
  })

  test("発動あり-基本形", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko])
    offense = activateSkill(context, offense, 0)
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
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result, "offense", chiko)).toBe(true)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(192)
    expect(result.damageFixed).toBe(0)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(192)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko])
    offense = activateSkill(context, offense, 0)
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
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result, "offense", chiko)).toBe(false)
    expect(result.damageBase?.variable).toBe(253)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(253)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動あり-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko, hiiru])
    offense = activateSkill(context, offense, 0, 1)
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
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result, "offense", chiko)).toBe(true)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    const t = getSkillTrigger(result, "offense", chiko)[0]
    expect(t.probability).toBe(21)
    expect(t.boostedProbability).toBe(21 * 1.2)
    expect(t.skillName).toBe("ラッシュアワー Lv.4")
    expect(t.triggered).toBe(true)
    expect(t.canTrigger).toBe(true)
    expect(t.invalidated).toBe(false)
    expect(t.denco).toMatchDenco(chiko)
    expect(t.denco.carIndex).toBe(0)
    expect(t.denco.who).toBe("offense")

    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(192)
    expect(result.damageFixed).toBe(0)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(192)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動なし-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko, hiiru])
    offense = activateSkill(context, offense, 0, 1)
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
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result, "offense", chiko)).toBe(false)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    const t = getSkillTrigger(result, "offense", chiko)[0]
    expect(t.probability).toBe(21)
    expect(t.boostedProbability).toBe(21 * 1.2)
    expect(t.skillName).toBe("ラッシュアワー Lv.4")
    expect(t.triggered).toBe(false)
    expect(t.canTrigger).toBe(false)
    expect(t.invalidated).toBe(false)

    expect(result.damageBase?.variable).toBe(253)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(253)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動あり-固定ダメージ追加", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let test = getFixedDamageDenco(10)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko, test])
    offense = activateSkill(context, offense, 0)
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
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result, "offense", chiko)).toBe(true)
    expect(hasSkillTriggered(result, "offense", test)).toBe(true)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(192)
    expect(result.damageFixed).toBe(10)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(202)
    expect(d.damage?.attr).toBe(true)
  })
})
