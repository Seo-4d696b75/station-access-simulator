import { AccessConfig, DencoManager, getAccessDenco, getSkillTrigger, hasSkillTriggered, init, initContext, initUser, startAccess, StationManager } from "../.."
import { testAlwaysSkill } from "../tool/skillState"


// デフォルトの経験値計算式を使用する
const accessScore = 100
const linkSuccessScore = 100

describe("ミユのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "69",
    name: "miyu",
  })

  test("発動なし-守備側なし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let miyu = DencoManager.getDenco(context, "69", 50)
    const offense = initUser(context, "とあるマスター１", [reika, miyu])
    offense.user.getDailyDistance = (_) => 100
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
    expect(result.offense.score.access.accessBonus).toBe(accessScore)
    expect(result.offense.score.access.damageBonus).toBe(0)
    expect(result.offense.score.access.linkBonus).toBe(linkSuccessScore)
    expect(result.offense.score.access.total).toBe(accessScore + linkSuccessScore)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.total).toBe(accessScore + linkSuccessScore)
    expect(result.offense.displayedScore).toBe(accessScore + linkSuccessScore)
    expect(result.offense.displayedExp).toBe(accessScore + linkSuccessScore)
    expect(hasSkillTriggered(result, "offense", miyu)).toBe(false)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access.accessBonus).toBe(accessScore)
    expect(d.exp.access.damageBonus).toBe(0)
    expect(d.exp.access.linkBonus).toBe(linkSuccessScore)
    expect(d.exp.access.total).toBe(accessScore + linkSuccessScore)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    expect(d.exp.total).toBe(accessScore + linkSuccessScore)
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
    defense.user.getDailyDistance = (_) => 100
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
    expect(result.offense.score.access.accessBonus).toBe(accessScore)
    expect(result.offense.score.access.damageBonus).toBe(260)
    expect(result.offense.score.access.linkBonus).toBe(0)
    expect(result.offense.score.access.total).toBe(accessScore + 260)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.total).toBe(accessScore + 260)
    expect(result.offense.displayedScore).toBe(accessScore + 260)
    expect(result.offense.displayedExp).toBe(accessScore + 260)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", miyu)).toBe(false)
    expect(result.defense?.score.total).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(result, "defense")
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.total).toBe(0)
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
    offense.user.getDailyDistance = (_) => 100
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
    expect(result.offense.score.access.accessBonus).toBe(accessScore)
    expect(result.offense.score.access.damageBonus).toBe(0)
    expect(result.offense.score.access.linkBonus).toBe(linkSuccessScore)
    expect(result.offense.score.access.total).toBe(accessScore + linkSuccessScore)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.total).toBe(accessScore + linkSuccessScore)
    expect(result.offense.displayedScore).toBe(accessScore + linkSuccessScore)
    expect(result.offense.displayedExp).toBe(accessScore + linkSuccessScore)
    expect(hasSkillTriggered(result, "offense", miyu)).toBe(false)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access.accessBonus).toBe(accessScore)
    expect(d.exp.access.damageBonus).toBe(0)
    expect(d.exp.access.linkBonus).toBe(linkSuccessScore)
    expect(d.exp.access.total).toBe(accessScore + linkSuccessScore)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    expect(d.exp.total).toBe(accessScore + linkSuccessScore)
  })
  test("発動なし-移動距離1km未満", () => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika, miyu
    ])
    offense.user.getDailyDistance = (_) => 0.9
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
    expect(result.offense.score.access.total).toBe(accessScore + 260)
    expect(result.offense.displayedScore).toBe(accessScore + 260)
    expect(result.offense.displayedExp).toBe(accessScore + 260)
    expect(hasSkillTriggered(result, "offense", miyu)).toBe(false)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.score.total).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access.total).toBe(accessScore + 260)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
  })
  test.each([1, 2, 5, 10, 20, 50, 80, 99])("発動あり-移動距離100km未満: %dkm", (dist) => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika, miyu
    ])
    offense.user.getDailyDistance = (_) => dist
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
    const damageScore = 260
    const skillScore = Math.floor(150 * dist / 100)
    expect(result.linkSuccess).toBe(false)
    expect(result.offense.score.access.total).toBe(accessScore + damageScore)
    expect(result.offense.score.total).toBe(accessScore + damageScore)
    expect(result.offense.displayedScore).toBe(accessScore + damageScore)
    expect(result.offense.displayedExp).toBe(accessScore + damageScore + skillScore)
    expect(hasSkillTriggered(result, "offense", miyu)).toBe(true)
    let t = getSkillTrigger(result, "offense", miyu)[0]
    expect(t.skillName).toBe("きらきらリスペクト Lv.4")
    expect(t.triggered).toBe(true)

    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.score.total).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access.accessBonus).toBe(accessScore)
    expect(d.exp.access.damageBonus).toBe(damageScore)
    expect(d.exp.access.linkBonus).toBe(0)
    expect(d.exp.access.total).toBe(accessScore + damageScore)
    expect(d.exp.skill).toBe(skillScore)
    expect(d.exp.link).toBe(0)
    expect(d.exp.total).toBe(accessScore + damageScore + skillScore)
  })
  test.each([100, 101, 110, 150, 200])("発動あり-移動距離100km以上: %dkm", (dist) => {
    const context = initContext("test", "test", false)
    let miyu = DencoManager.getDenco(context, "69", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let seria = DencoManager.getDenco(context, "1", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika, seria, miyu
    ])
    offense.user.getDailyDistance = (_) => dist
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
    expect(result.offense.score.access.total).toBe(accessScore + 260)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.total).toBe(accessScore + 260)
    expect(result.offense.displayedScore).toBe(accessScore + 260)
    expect(result.offense.displayedExp).toBe(accessScore + 260 + 150 + 140)
    expect(hasSkillTriggered(result, "offense", miyu)).toBe(true)
    let t = getSkillTrigger(result, "offense", miyu)[0]
    expect(t.skillName).toBe("きらきらリスペクト Lv.4")
    expect(t.triggered).toBe(true)

    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.score.total).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access.accessBonus).toBe(accessScore)
    expect(d.exp.access.linkBonus).toBe(0)
    expect(d.exp.access.damageBonus).toBe(260)
    expect(d.exp.access.total).toBe(accessScore + 260)
    expect(d.exp.skill).toBe(150 + 140)
    expect(d.exp.link).toBe(0)
    expect(d.exp.total).toBe(accessScore + 260 + 150 + 140)
    d = result.offense.formation[1]  // seria
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.skill).toBe(140)
    expect(d.exp.link).toBe(0)
    expect(d.exp.total).toBe(140)
    d = result.offense.formation[2]  // miyu
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.skill).toBe(140)
    expect(d.exp.link).toBe(0)
    expect(d.exp.total).toBe(140)
    // after result
    reika = result.offense.formation[0]
    seria = result.offense.formation[1]
    miyu = result.offense.formation[2]
    expect(reika.currentExp).toBe(accessScore + 260 + 150 + 140)
    expect(seria.currentExp).toBe(140)
    expect(miyu.currentExp).toBe(140)
  })
})