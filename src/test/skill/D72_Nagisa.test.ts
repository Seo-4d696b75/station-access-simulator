import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../tool/skillState"

describe("ナギサのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "72",
    name: "nagisa"
  })


  test.each(Array(14).fill(0).map((_, i) => i + 1))("発動あり-攻撃側(アクセス)-cool x%d", (count) => {
    const context = initContext("test", "test", false)
    // ７編成x2
    let seria = DencoManager.getDenco(context, "1", 50)
    let mero = DencoManager.getDenco(context, "2", 50)
    let luna = DencoManager.getDenco(context, "3", 50)
    let miroku = DencoManager.getDenco(context, "4", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let sheena = DencoManager.getDenco(context, "7", 50)
    let saya = DencoManager.getDenco(context, "8", 50)
    let moe = DencoManager.getDenco(context, "9", 50)
    let iroha = DencoManager.getDenco(context, "10", 50)
    let siira = DencoManager.getDenco(context, "11", 50)
    let izuna = DencoManager.getDenco(context, "13", 50)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let nagisa = DencoManager.getDenco(context, "72", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [nagisa, seria, mero, luna, miroku, reika, sheena])
    let defense = initUser(context, "とあるマスター２", [charlotte, saya, moe, iroha, siira, izuna, fubu])
    // cool属性数を調整
    offense.formation.forEach((d, i) => d.attr = (i < count ? "cool" : "heat"))
    defense.formation.forEach((d, i) => d.attr = (i + 7 < count ? "cool" : "heat"))
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
    expect(hasSkillTriggered(result.offense, nagisa)).toBe(true)
    expect(result.attackPercent).toBe(0)
    expect(result.damageFixed).toBe(Math.floor(210 * Math.pow(count / 14, 2)))
  })


  test("発動なし-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    // ７編成x2
    let seria = DencoManager.getDenco(context, "1", 50)
    let nagisa = DencoManager.getDenco(context, "72", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, nagisa])
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
    expect(hasSkillTriggered(result.offense, nagisa)).toBe(false)
    expect(result.attackPercent).toBe(0)
    expect(result.damageFixed).toBe(0)
  })
})