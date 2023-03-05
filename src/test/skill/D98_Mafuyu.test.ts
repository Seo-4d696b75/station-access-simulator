import { activateSkill, DencoAttribute, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("まふゆのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "98",
    name: "mafuyu",
    active: 3600,
    cooldown: 9000,
  })

  test.each([0, 1, 2, 3, 4])("編成位置%d", (idx) => {
    const context = initContext("test", "test", false)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let iroha = DencoManager.getDenco(context, "10", 50)
    let mafuyu = DencoManager.getDenco(context, "98", 50)
    let siira = DencoManager.getDenco(context, "11", 50)
    let ichiho = DencoManager.getDenco(context, "18", 50)
    let offense = initUser(context, "とあるマスター", [charlotte, iroha, mafuyu, siira, ichiho])
    offense = activateSkill(context, offense, 2)

    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let defense = initUser(context, "とあるマスター２", [miroku])
    const config = {
      offense: {
        state: offense,
        carIndex: idx
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: miroku.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", mafuyu)).toBe(idx < 2)
    expect(result.attackPercent).toBe(idx < 2 ? 14 : 0)
  })

  test.each(["eco", "heat", "cool", "flat"])("属性:%s", (attr) => {
    const context = initContext("test", "test", false)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    charlotte.attr = attr as DencoAttribute
    let mafuyu = DencoManager.getDenco(context, "98", 50)
    let offense = initUser(context, "とあるマスター", [charlotte, mafuyu])
    offense = activateSkill(context, offense, 1)

    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let defense = initUser(context, "とあるマスター２", [miroku])
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", mafuyu)).toBe(attr === "eco")
    expect(result.attackPercent).toBe(attr === "eco" ? 14 : 0)
  })

})