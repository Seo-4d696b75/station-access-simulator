import { DencoAttribute, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("みやびのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "70",
    name: "miyabi",
    active: 7200,
    cooldown: 3600,
  })

  const attrList: DencoAttribute[] = [
    "heat",
    "cool",
    "eco",
    "flat"
  ]
  test.each(attrList)("守備側（被アクセス）-相手属性：%s", (attr) => {

    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let miyabi = DencoManager.getDenco(context, "70", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    charlotte.attr = attr // 相手の属性を変更
    let defense = initUser(context, "とあるマスター", [miyabi, seria])
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
      station: miyabi.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    const trigger = attr === "heat"
    expect(hasSkillTriggered(result.defense, miyabi)).toBe(trigger)
    expect(result.defendPercent).toBe(trigger ? 42 : 0)
  })

  test("発動なし-守備側（編成内）", () => {

    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let miyabi = DencoManager.getDenco(context, "70", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [miyabi, seria])
    defense = activateSkill(context, defense, 0)
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, miyabi)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
})