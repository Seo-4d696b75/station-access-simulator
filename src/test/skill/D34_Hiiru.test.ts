import { activateSkill, getSkillTrigger, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import { testManualSkill } from "../tool/skillState"

describe("ひいるのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "34",
    name: "hiiru",
    active: 3600,
    cooldown: 5400,
  })

  test("確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [hiiru, siira])
    defense = activateSkill(context, defense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    // 確率補正の確認
    expect(hasSkillTriggered(result, "defense", siira)).toBe(true)
    expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)
    
    let t = getSkillTrigger(result, "defense", hiiru)[0]
    expect(t.skillName).toBe("テンションAGEAGE↑↑ Lv.4")
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(100)

    t = getSkillTrigger(result, "defense", siira)[0]
    expect(t.skillName).toBe("ペインガード Lv.4")
    expect(t.probability).toBe(25)
    expect(t.boostedProbability).toBe(25 * 1.2)

  })


  test("アクセス内では無効化の前に発動する", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let susugu = DencoManager.getDenco(context, "EX03", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let offense = initUser(context, "とあるマスター", [reika, susugu])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [hiiru, siira])
    defense = activateSkill(context, defense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    // 確率補正の確認
    expect(hasSkillTriggered(result, "offense", susugu)).toBe(false)
    expect(hasSkillTriggered(result, "defense", siira)).toBe(true)
    expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)

  })
})