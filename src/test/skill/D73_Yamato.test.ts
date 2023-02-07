import { DencoAttribute, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("やまとのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "73",
    name: "yamato",
    active: 3600,
    cooldown: 7200
  })

  test("発動あり-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let yamato = DencoManager.getDenco(context, "73", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [yamato, seria])
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
      station: yamato.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", yamato)).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.damageFixed).toBe(-70)
  })

  const attrList: DencoAttribute[] = ["cool", "heat", "eco", "flat"]

  test.each(attrList)("発動あり-守備側(編成内)-属性：%s", (attr) => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let yamato = DencoManager.getDenco(context, "73", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    // 属性揃える
    seria.attr = attr
    charlotte.attr = attr
    let defense = initUser(context, "とあるマスター", [seria, yamato])
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", yamato)).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.damageFixed).toBe(-70)
  })

  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let yamato = DencoManager.getDenco(context, "73", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [yamato, seria])
    defense = activateSkill(context, defense, 0)
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
      station: yamato.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", yamato)).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.damageFixed).toBe(0)
  })

  test("発動なし-守備側(編成内)", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let yamato = DencoManager.getDenco(context, "73", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika, yamato])
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", yamato)).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.damageFixed).toBe(0)
  })

})