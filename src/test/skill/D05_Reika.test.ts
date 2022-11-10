import { init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, isSkillActive } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../skillState"

describe("レイカのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "5",
    name: "reika",
    active: 900,
    cooldown: 5400,
  })

  test("発動なし-非アクティブ", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
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
    expect(hasSkillTriggered(result.offense, reika)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-守備側", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika, seria])
    defense = activateSkill(context, defense, 0)
    reika = defense.formation[0]
    expect(isSkillActive(reika.skill)).toBe(true)
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, reika)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動あり-攻撃側", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, seria])
    offense = activateSkill(context, offense, 0)
    reika = offense.formation[0]
    expect(isSkillActive(reika.skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
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
    expect(hasSkillTriggered(result.offense, reika)).toBe(true)
    expect(result.attackPercent).toBe(25)
  })
  test("発動あり-確率ブースト", () => {
    const context = initContext("test", "test", false)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, hiiru])
    offense = activateSkill(context, offense, 0)
    reika = offense.formation[0]
    expect(isSkillActive(reika.skill)).toBe(true)
    offense = activateSkill(context, offense, 1)
    hiiru = offense.formation[1]
    expect(isSkillActive(hiiru.skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
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
    expect(hasSkillTriggered(result.offense, reika)).toBe(true)
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(false)
    expect(result.attackPercent).toBe(25)
  })
  test("発動あり-編成内", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, seria])
    offense = activateSkill(context, offense, 0)
    reika = offense.formation[0]
    expect(isSkillActive(reika.skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 1
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, reika)).toBe(true)
    expect(result.attackPercent).toBe(25)
    let accessSeria = getAccessDenco(result, "offense")
    expect(accessSeria.name).toBe("seria")
  })
})