import assert from "assert"
import { AccessConfig, DencoManager, getAccessDenco, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import "../../gen/matcher"
import { testAlwaysSkill } from "../tool/skillState"

// デフォルトの経験値計算式を使用する
const accessScore = 100
const linkSuccessScore = 100

describe("にころのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "20",
    name: "nikoro"
  })

  test("発動なし-守備側編", () => {
    const context = initContext("test", "test", false)
    let nikoro = DencoManager.getDenco(context, "20", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika
    ])
    const defense = initUser(context, "とあるマスター２", [
      charlotte, nikoro
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
    expect(hasSkillTriggered(result.defense, nikoro)).toBe(false)
    expect(result.defense?.score.total).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    expect(result.defense?.event.length).toBe(1)
    expect(result.defense?.event[0].type).toBe("access")
  })
  test("発動あり-攻撃側編-リンク失敗", () => {
    const context = initContext("test", "test", false)
    let nikoro = DencoManager.getDenco(context, "20", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.nextExp = Number.MAX_SAFE_INTEGER
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      nikoro, reika
    ])
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
    expect(hasSkillTriggered(result.offense, nikoro)).toBe(false) // アクセス後の発動
    expect(result.offense.event.length).toBe(2)
    expect(result.offense.event[0].type).toBe("access")
    expect(result.offense.event[1].type).toBe("skill_trigger")
    expect(result.linkSuccess).toBe(false)
    expect(result.offense.score.access.accessBonus).toBe(accessScore)
    expect(result.offense.score.access.damageBonus).toBe(220)
    expect(result.offense.score.access.linkBonus).toBe(0)
    expect(result.offense.score.access.total).toBe(accessScore + 220)
    expect(result.offense.score.total).toBe(accessScore + 220)
    expect(result.offense.displayedExp).toBe(accessScore + 220)
    let event = result.offense.event[1]
    assert(event.type === "skill_trigger")
    nikoro = getAccessDenco(result, "offense")
    expect(nikoro).toMatchDencoState(event.data.denco)
    expect(event.data.carIndex).toBe(0)
    expect(event.data.step).toBe("self")
    expect(event.data.time).toBe(result.time)

    let d = result.offense.formation[1]
    const exp = Math.floor((accessScore + 220) * 0.25)
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.skill).toBe(0) // アクセス中には付与されない
    expect(d.exp.link).toBe(0)
    expect(d.exp.total).toBe(0)
    expect(d.currentExp).toBe(exp) // アクセス直後に直接加算
    d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(220)
  })
  test("発動あり-攻撃側編-リンク成功", () => {
    const context = initContext("test", "test", false)
    let nikoro = DencoManager.getDenco(context, "20", 80)
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.nextExp = Number.MAX_SAFE_INTEGER
    let charlotte = DencoManager.getDenco(context, "6", 50, 3)
    const offense = initUser(context, "とあるマスター１", [
      nikoro, reika
    ])
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
    expect(hasSkillTriggered(result.offense, nikoro)).toBe(false) // アクセス後の発動
    expect(result.offense.event.length).toBe(2)
    expect(result.offense.event[0].type).toBe("access")
    expect(result.offense.event[1].type).toBe("skill_trigger")
    expect(result.linkSuccess).toBe(true)
    expect(result.offense.score.access.accessBonus).toBe(accessScore)
    expect(result.offense.score.access.damageBonus).toBe(310)
    expect(result.offense.score.access.linkBonus).toBe(linkSuccessScore)
    expect(result.offense.score.access.total).toBe(accessScore + 310 + linkSuccessScore)
    expect(result.offense.score.total).toBe(accessScore + 310 + linkSuccessScore)
    expect(result.offense.displayedExp).toBe(accessScore + 310 + linkSuccessScore)
    let event = result.offense.event[1]
    assert(event.type === "skill_trigger")
    nikoro = getAccessDenco(result, "offense")
    expect(nikoro).toMatchDencoState(event.data.denco)
    expect(event.data.carIndex).toBe(0)
    expect(event.data.step).toBe("self")
    expect(event.data.time).toBe(result.time)

    let d = result.offense.formation[1]
    const exp = Math.floor((accessScore + 310 + linkSuccessScore) * 0.4)
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.skill).toBe(0) // アクセス中には付与されない
    expect(d.exp.link).toBe(0)
    expect(d.exp.total).toBe(0)
    expect(d.currentExp).toBe(exp) // アクセス直後に直接加算
    d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(310)
    expect(d.reboot).toBe(true)
  })
  test("発動あり-守備側編-リブート", () => {
    const context = initContext("test", "test", false)
    let nikoro = DencoManager.getDenco(context, "20", 50, 2)
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.nextExp = Number.MAX_SAFE_INTEGER
    nikoro.nextExp = Number.MAX_SAFE_INTEGER
    let charlotte = DencoManager.getDenco(context, "6", 80)
    const offense = initUser(context, "とあるマスター１", [
      charlotte
    ])
    const defense = initUser(context, "とあるマスター２", [
      nikoro, reika
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
      station: nikoro.link[0],
    }
    const result = startAccess(context, config)
    expect(hasSkillTriggered(result.defense, nikoro)).toBe(false) // アクセス後の発動
    expect(result.defense).not.toBeUndefined()
    assert(result.defense)
    expect(result.defense.event.length).toBe(3)
    expect(result.defense.event[0].type).toBe("access")
    expect(result.defense.event[1].type).toBe("reboot")
    expect(result.defense.event[2].type).toBe("skill_trigger")
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)
    let event = result.defense.event[1]
    assert(event.type === "reboot")
    let reboot = event.data
    expect(reboot.link.length).toBe(2)
    expect(result.defense.score.access.total).toBe(0)
    expect(result.defense.score.link).toBe(reboot.totalScore) //全リンクのスコア
    expect(result.defense.score.skill).toBe(0)
    expect(result.defense.score.total).toBe(reboot.totalScore)
    expect(result.defense.displayedScore).toBe(reboot.link[0].totalScore) // 解除されたリンクのスコア・経験値
    expect(result.defense.displayedExp).toBe(reboot.link[0].totalScore)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(true)
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(reboot.exp)
    expect(d.exp.total).toBe(reboot.exp)
    expect(d.disconnectedLink).not.toBeUndefined()
    expect(d.disconnectedLink).toMatchLinksResult(reboot)
    event = result.defense.event[2]
    assert(event.type === "skill_trigger")
    let trigger = event.data
    expect(d).toMatchDencoState(trigger.denco)
    expect(trigger.carIndex).toBe(0)
    expect(trigger.step).toBe("self")
    expect(trigger.time).toBe(result.time)
    d = result.defense.formation[1]
    const exp = Math.floor(reboot.exp * 0.25)
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.skill).toBe(0) // アクセス中には付与されない
    expect(d.exp.link).toBe(0)
    expect(d.exp.total).toBe(0)
    expect(d.currentExp).toBe(exp) // アクセス直後に直接加算

  })
  test("発動あり-守備側編-フットバース", () => {
    const context = initContext("test", "test", false)
    let nikoro = DencoManager.getDenco(context, "20", 50, 2)
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.nextExp = Number.MAX_SAFE_INTEGER
    nikoro.nextExp = Number.MAX_SAFE_INTEGER
    let charlotte = DencoManager.getDenco(context, "6", 80)
    const offense = initUser(context, "とあるマスター１", [
      charlotte
    ])
    const defense = initUser(context, "とあるマスター２", [
      nikoro, reika
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
      station: nikoro.link[0],
      usePink: true
    }
    const result = startAccess(context, config)
    expect(hasSkillTriggered(result.defense, nikoro)).toBe(false) // アクセス後の発動
    expect(result.defense).not.toBeUndefined()
    assert(result.defense)
    expect(result.defense.event.length).toBe(2)
    expect(result.defense.event[0].type).toBe("access")
    expect(result.defense.event[1].type).toBe("skill_trigger")
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBeGreaterThan(0)
    assert(d.disconnectedLink)
    let reboot = d.disconnectedLink
    expect(reboot.link.length).toBe(1)
    expect(reboot.link[0]).toMatchStationLink(nikoro.link[0])
    expect(result.defense.score.link).toBe(reboot.totalScore)
    expect(d.exp.link).toBe(reboot.exp)
    expect(result.defense.score.access.total).toBe(0)
    expect(result.defense.score.skill).toBe(0)
    expect(result.defense.score.link).toBe(reboot.totalScore)
    expect(result.defense.score.total).toBe(reboot.totalScore)
    expect(result.defense.displayedScore).toBe(reboot.totalScore) // 解除されたリンクのスコア・経験値
    expect(result.defense.displayedExp).toBe(reboot.exp)
    let e = result.defense.event[1]
    assert(e.type === "skill_trigger")
    let trigger = e.data
    expect(d).toMatchDencoState(trigger.denco)
    expect(trigger.carIndex).toBe(0)
    expect(trigger.step).toBe("self")
    expect(trigger.time).toBe(result.time)
    d = result.defense.formation[1]
    const exp = Math.floor(reboot.exp * 0.25)
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.skill).toBe(0) // アクセス中には付与されない
    expect(d.exp.link).toBe(0)
    expect(d.currentExp).toBe(exp) // アクセス直後に直接加算

  })
  test("発動あり-守備側編-リブート-レベルアップ", () => {
    const context = initContext("test", "test", false)
    let nikoro = DencoManager.getDenco(context, "20", 59, 2)
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.nextExp = Number.MAX_SAFE_INTEGER
    nikoro.currentExp = nikoro.nextExp - 1000
    let charlotte = DencoManager.getDenco(context, "6", 80)
    const offense = initUser(context, "とあるマスター１", [
      charlotte
    ])
    const defense = initUser(context, "とあるマスター２", [
      nikoro, reika
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
      station: nikoro.link[0],
    }
    const result = startAccess(context, config)
    expect(hasSkillTriggered(result.defense, nikoro)).toBe(false) // アクセス後の発動
    expect(result.defense).not.toBeUndefined()
    assert(result.defense)
    expect(result.defense.event.length).toBe(4)
    expect(result.defense.event[0].type).toBe("access")
    expect(result.defense.event[1].type).toBe("reboot")
    expect(result.defense.event[2].type).toBe("levelup")
    expect(result.defense.event[3].type).toBe("skill_trigger")
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)
    let event = result.defense.event[1]
    assert(event.type === "reboot")
    let reboot = event.data
    expect(reboot.link.length).toBe(2)
    expect(result.defense.score.access.total).toBe(0)
    expect(result.defense.score.skill).toBe(0)
    expect(result.defense.score.link).toBe(reboot.totalScore)
    expect(result.defense.displayedScore).toBe(reboot.link[0].totalScore) // 解除されたリンクのスコア・経験値
    expect(result.defense.displayedExp).toBe(reboot.link[0].totalScore)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(true)
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(reboot.exp)
    expect(d.disconnectedLink).not.toBeUndefined()
    expect(d.disconnectedLink).toMatchLinksResult(reboot)
    event = result.defense.event[2]
    assert(event.type === "levelup")
    let levelup = event.data
    expect(levelup.before.name).toBe("nikoro")
    expect(d).toMatchDencoState(levelup.after)
    expect(levelup.after.level).toBe(60)
    event = result.defense.event[3]
    assert(event.type === "skill_trigger")
    let trigger = event.data
    expect(d).toMatchDencoState(trigger.denco)
    expect(trigger.carIndex).toBe(0)
    expect(trigger.step).toBe("self")
    expect(trigger.time).toBe(result.time)
    d = result.defense.formation[1]
    // TODO 現行仕様だとレベルアップ前のスキルレベルの値25%が適用されている
    const exp = Math.floor(reboot.exp * 0.3) // レベルアップ後のスキルレベルが適用
    expect(d.exp.access.total).toBe(0)
    expect(d.exp.skill).toBe(0) // アクセス中には付与されない
    expect(d.exp.link).toBe(0)
    expect(d.currentExp).toBe(exp) // アクセス直後に直接加算

  })
})