import { activateSkill, getDefense, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import { testManualSkill } from "../skillState"

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
    const d = getDefense(result)
    // 確率補正の確認
    expect(hasSkillTriggered(result.defense, siira)).toBe(true)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    let trigger = d.triggeredSkills[0]
    expect(trigger.name).toBe(hiiru.name)
    expect(trigger.step).toBe("probability_check")
    expect(d.probabilityBoostPercent).toBe(20)
    expect(d.probabilityBoosted).toBe(true)
  })
})