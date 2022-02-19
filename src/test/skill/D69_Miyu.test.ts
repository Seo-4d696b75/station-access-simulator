import moment from "moment-timezone"
import { AccessConfig, activateSkill, DencoManager, disactivateSkill, getAccessDenco, getSkill, hasSkillTriggered, init, initContext, initUser, refreshState, startAccess, StationManager } from "../.."


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
    expect(() => disactivateSkill(context, state, 0)).toThrowError()


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
    offense.dailyDistance = 100
    const station = StationManager.getRandomStation(context, 1)[0]
    const config: AccessConfig = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: station,
    }
    const {access} = startAccess(context, config)
    expect(access.defense).toBeUndefined()
    expect(access.offense.score).toBe(accessScore + linkSuccessScore)
    expect(access.offense.displayedScore).toBe(accessScore + linkSuccessScore)
    expect(access.offense.displayedExp).toBe(accessScore + linkSuccessScore)
    expect(hasSkillTriggered(access.offense, miyu)).toBe(false)
    let d = getAccessDenco(access, "offense")
    expect(d.exp.access).toBe(accessScore + linkSuccessScore)
    expect(d.exp.skill).toBe(0)
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
    defense.dailyDistance = 100
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
    const {access} = startAccess(context, config)
    expect(access.offense.score).toBe(accessScore + 260)
    expect(access.offense.displayedScore).toBe(accessScore + 260)
    expect(access.offense.displayedExp).toBe(accessScore + 260)
    expect(access.defense).not.toBeUndefined()
    expect(hasSkillTriggered(access.defense, miyu)).toBe(false)
    expect(access.defense?.score).toBe(0)
    expect(access.defense?.displayedScore).toBe(0)
    expect(access.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(access, "defense")
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
    offense.dailyDistance = 100
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
    const {access} = startAccess(context, config)
    expect(access.offense.score).toBe(accessScore + linkSuccessScore)
    expect(access.offense.displayedScore).toBe(accessScore + linkSuccessScore)
    expect(access.offense.displayedExp).toBe(accessScore + linkSuccessScore)
    expect(hasSkillTriggered(access.offense, miyu)).toBe(false)
  })
  test("発動なし-移動距離1km未満", () => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika, miyu
    ])
    offense.dailyDistance = 0.9
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
    const {access} = startAccess(context, config)
    expect(access.linkSuccess).toBe(false)
    expect(access.offense.score).toBe(accessScore + 260)
    expect(access.offense.displayedScore).toBe(accessScore + 260)
    expect(access.offense.displayedExp).toBe(accessScore + 260)
    expect(hasSkillTriggered(access.offense, miyu)).toBe(false)
    expect(access.defense).not.toBeUndefined()
    expect(access.defense?.score).toBe(0)
    expect(access.defense?.displayedScore).toBe(0)
    expect(access.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(access, "offense")
    expect(d.exp.access).toBe(accessScore + 260)
    expect(d.exp.skill).toBe(0)
  })
  test("発動あり-移動距離100km未満", () => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika, miyu
    ])
    offense.dailyDistance = 50
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
    const {access} = startAccess(context, config)
    expect(access.linkSuccess).toBe(false)
    expect(access.offense.score).toBe(accessScore + 260)
    expect(access.offense.displayedScore).toBe(accessScore + 260)
    expect(access.offense.displayedExp).toBe(accessScore + 260 + 75)
    expect(hasSkillTriggered(access.offense, miyu)).toBe(true)
    expect(access.defense).not.toBeUndefined()
    expect(access.defense?.score).toBe(0)
    expect(access.defense?.displayedScore).toBe(0)
    expect(access.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(access, "offense")
    expect(d.exp.access).toBe(accessScore + 260)
    expect(d.exp.skill).toBe(75)
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
    offense.dailyDistance = 120
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
    const access = result.access
    expect(access.linkSuccess).toBe(false)
    expect(access.offense.score).toBe(accessScore + 260)
    expect(access.offense.displayedScore).toBe(accessScore + 260)
    expect(access.offense.displayedExp).toBe(accessScore + 260 + 150 + 140)
    expect(hasSkillTriggered(access.offense, miyu)).toBe(true)
    expect(access.defense).not.toBeUndefined()
    expect(access.defense?.score).toBe(0)
    expect(access.defense?.displayedScore).toBe(0)
    expect(access.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(access, "offense")
    expect(d.exp.access).toBe(accessScore + 260)
    expect(d.exp.skill).toBe(150 + 140)
    d = access.offense.formation[1]  // seria
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(140)
    d = access.offense.formation[2]  // miyu
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(140)
    // after access
    reika = result.offense.formation[0]
    seria = result.offense.formation[1]
    miyu = result.offense.formation[2]
    expect(reika.currentExp).toBe(accessScore + 260 + 150 + 140)
    expect(seria.currentExp).toBe(140)
    expect(miyu.currentExp).toBe(140)
  })
})