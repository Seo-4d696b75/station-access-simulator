import { getSkill, init } from "../.."
import { getAccessDenco, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../skillState"

describe("メロのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "2",
    name: "mero"
  })

  test("発動なし-フットバース使用", () => {
    const context = initContext("test", "test", false)
    let mero = DencoManager.getDenco(context, "2", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [mero])
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
    expect(result.offense.triggeredSkills.length).toBe(0)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    let accessReika = getAccessDenco(result, "defense")
    expect(accessReika.reboot).toBe(false)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let mero = DencoManager.getDenco(context, "2", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [mero])
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
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.pinkMode).toBe(false)
    expect(result.offense.triggeredSkills.length).toBe(0)
    if (result.defense) {
      let d = getAccessDenco(result, "defense")
      expect(d.damage?.value).toBe(200)
      expect(d.hpBefore).toBe(192)
      expect(d.hpAfter).toBe(0)
      expect(d.reboot).toBe(true)
    }
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mero = DencoManager.getDenco(context, "2", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [mero])
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
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.pinkMode).toBe(true)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.offense.triggeredSkills.length).toBe(1)
    let trigger = result.offense.triggeredSkills[0]
    expect(trigger.step).toBe("pink_check")
    expect(trigger.numbering).toBe("2")
    expect(trigger.name).toBe("mero")
    if (result.defense) {
      let accessReika = getAccessDenco(result, "defense")
      expect(accessReika.reboot).toBe(false)
      expect(accessReika.damage).toBeUndefined()
    }
  })
  test("発動あり-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mero = DencoManager.getDenco(context, "2", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [mero, hiiru])
    offense = activateSkill(context, offense, 1)
    hiiru = offense.formation[1]
    let skill = getSkill(hiiru)
    expect(skill.state.type).toBe("active")
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
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.pinkMode).toBe(true)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.offense.triggeredSkills.length).toBe(1)
    // メロ本人 ひいるの確率ブーストは乗らない
    let trigger = result.offense.triggeredSkills[0]
    expect(trigger.step).toBe("pink_check")
    expect(trigger.numbering).toBe("2")
    expect(trigger.name).toBe("mero")
    if (result.defense) {
      let accessReika = getAccessDenco(result, "defense")
      expect(accessReika.reboot).toBe(false)
      expect(accessReika.damage).toBeUndefined()
    }
  })
})