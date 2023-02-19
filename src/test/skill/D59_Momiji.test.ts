import { init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../tool/skillState"


describe("ららのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "59",
    name: "momiji",
  })

  describe("発動あり-攻撃側（アクセス）", () => {
    test.each([1, 2, 3, 4])("%d種類", (cnt) => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let seria = DencoManager.getDenco(context, "1", 50)
      let momiji = DencoManager.getDenco(context, "59", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let reika = DencoManager.getDenco(context, "5", 50)
      let luna = DencoManager.getDenco(context, "3", 50)
      let saya = DencoManager.getDenco(context, "8", 50)
      let offense = initUser(context, "とあるマスター", [momiji, seria])
      let defense = initUser(context, "とあるマスター２", [charlotte, reika, luna, saya].slice(0, cnt))
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
      expect(hasSkillTriggered(result, "offense", momiji)).toBe(true)
      expect(result.attackPercent).toBe(15 * cnt)
    })
  })


  test("発動あり-攻撃側（アクセス）-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let momiji = DencoManager.getDenco(context, "59", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [momiji, hiiru])
    offense = activateSkill(context, offense, 1)
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
    expect(hasSkillTriggered(result, "offense", momiji)).toBe(true)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    const t = getSkillTrigger(result, "offense", momiji)[0]
    expect(t.skillName).toBe("飛びつき型ディーゼル Lv.4")
    expect(t.probability).toBe(55)
    expect(t.boostedProbability).toBe(55 * 1.2)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
    expect(result.attackPercent).toBe(15)
  })
  test("発動なし-攻撃側（アクセス）-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let momiji = DencoManager.getDenco(context, "59", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [momiji, hiiru])
    offense = activateSkill(context, offense, 1)
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
    expect(hasSkillTriggered(result, "offense", momiji)).toBe(false)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    const t = getSkillTrigger(result, "offense", momiji)[0]
    expect(t.skillName).toBe("飛びつき型ディーゼル Lv.4")
    expect(t.probability).toBe(55)
    expect(t.boostedProbability).toBe(55 * 1.2)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-攻撃側（編成内）", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let momiji = DencoManager.getDenco(context, "59", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [momiji, seria])
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
    expect(hasSkillTriggered(result, "offense", momiji)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
})