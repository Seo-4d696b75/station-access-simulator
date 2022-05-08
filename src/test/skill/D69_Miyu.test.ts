import moment from "moment-timezone"
import { AccessConfig, activateSkill, DencoManager, deactivateSkill, getAccessDenco, getSkill, hasSkillTriggered, init, initContext, initUser, refreshState, startAccess, StationManager } from "../.."


// デフォルトの経験値計算式を使用する
const accessScore = 100
const linkSuccessScore = 100

describe("ミユのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    expect(miyu.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [miyu])
    const now = moment().valueOf()
    context.clock = now
    state = refreshState(context, state)
    miyu = state.formation[0]
    let skill = getSkill(miyu)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")

    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => deactivateSkill(context, state, 0)).toThrowError()


    context.clock = now + 600 * 1000
    state = refreshState(context, state)
    miyu = state.formation[0]
    skill = getSkill(miyu)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")
  })
  test("発動なし-守備側なし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let miyu = DencoManager.getDenco(context, "69", 50)
    const offense = initUser(context, "とあるマスター１", [reika, miyu])
    offense.user.dailyDistance = 100
    const station = StationManager.getRandomStation(context, 1)[0]
    const config: AccessConfig = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: station,
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(result.offense.score.access).toBe(accessScore + linkSuccessScore)
    expect(result.offense.displayedScore).toBe(accessScore + linkSuccessScore)
    expect(result.offense.displayedExp).toBe(accessScore + linkSuccessScore)
    expect(hasSkillTriggered(result.offense, miyu)).toBe(false)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access).toBe(accessScore + linkSuccessScore)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
  })
  test("発動なし-守備側編成内", () => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika
    ])
    const defense = initUser(context, "とあるマスター２", [
      charlotte, miyu
    ])
    defense.user.dailyDistance = 100
    const config: AccessConfig = {
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
    expect(result.offense.score.access).toBe(accessScore + 260)
    expect(result.offense.displayedScore).toBe(accessScore + 260)
    expect(result.offense.displayedExp).toBe(accessScore + 260)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, miyu)).toBe(false)
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(result, "defense")
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.damage?.value).toBe(260)
  })
  test("発動なし-フットバース", () => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika, miyu
    ])
    offense.user.dailyDistance = 100
    const defense = initUser(context, "とあるマスター２", [
      charlotte, miyu
    ])
    const config: AccessConfig = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.offense.score.access).toBe(accessScore + linkSuccessScore)
    expect(result.offense.displayedScore).toBe(accessScore + linkSuccessScore)
    expect(result.offense.displayedExp).toBe(accessScore + linkSuccessScore)
    expect(hasSkillTriggered(result.offense, miyu)).toBe(false)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access).toBe(accessScore + linkSuccessScore)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
  })
  test("発動なし-移動距離1km未満", () => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika, miyu
    ])
    offense.user.dailyDistance = 0.9
    const defense = initUser(context, "とあるマスター２", [
      charlotte
    ])
    const config: AccessConfig = {
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
    expect(result.linkSuccess).toBe(false)
    expect(result.offense.score.access).toBe(accessScore + 260)
    expect(result.offense.displayedScore).toBe(accessScore + 260)
    expect(result.offense.displayedExp).toBe(accessScore + 260)
    expect(hasSkillTriggered(result.offense, miyu)).toBe(false)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access).toBe(accessScore + 260)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
  })
  test("発動あり-移動距離100km未満", () => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika, miyu
    ])
    offense.user.dailyDistance = 50
    const defense = initUser(context, "とあるマスター２", [
      charlotte
    ])
    const config: AccessConfig = {
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
    expect(result.linkSuccess).toBe(false)
    expect(result.offense.score.access).toBe(accessScore + 260)
    expect(result.offense.displayedScore).toBe(accessScore + 260)
    expect(result.offense.displayedExp).toBe(accessScore + 260 + 75)
    expect(hasSkillTriggered(result.offense, miyu)).toBe(true)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access).toBe(accessScore + 260)
    expect(d.exp.skill).toBe(75)
    expect(d.exp.link).toBe(0)
  })
  test("発動あり-移動距離100km以上", () => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let seria = DencoManager.getDenco(context, "1", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika, seria, miyu
    ])
    offense.user.dailyDistance = 120
    const defense = initUser(context, "とあるマスター２", [
      charlotte
    ])
    const config: AccessConfig = {
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
    expect(result.linkSuccess).toBe(false)
    expect(result.offense.score.access).toBe(accessScore + 260)
    expect(result.offense.displayedScore).toBe(accessScore + 260)
    expect(result.offense.displayedExp).toBe(accessScore + 260 + 150 + 140)
    expect(hasSkillTriggered(result.offense, miyu)).toBe(true)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access).toBe(accessScore + 260)
    expect(d.exp.skill).toBe(150 + 140)
    d = result.offense.formation[1]  // seria
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(140)
    expect(d.exp.link).toBe(0)
    d = result.offense.formation[2]  // miyu
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(140)
    expect(d.exp.link).toBe(0)
    // after result
    reika = result.offense.formation[0]
    seria = result.offense.formation[1]
    miyu = result.offense.formation[2]
    expect(reika.currentExp).toBe(accessScore + 260 + 150 + 140)
    expect(seria.currentExp).toBe(140)
    expect(miyu.currentExp).toBe(140)
  })
})