import assert from "assert"
import { init } from "../.."
import { AccessConfig, getAccessDenco, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../tool/skillState"

describe("シーナのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "7",
    name: "sheena"
  })

  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let sheena = DencoManager.getDenco(context, "7", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    const offense = initUser(context, "とあるマスター１", [
      sheena
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
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // 発動なし
    expect(hasSkillTriggered(result, "offense", sheena)).toBe(false)
    let t = getSkillTrigger(result, "defense", sheena)
    expect(t.length).toBe(0)
    // ダメージ計算
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(208)
    expect(d.damage?.attr).toBe(true)
    expect(d.hpBefore).toBe(228)
    expect(d.hpAfter).toBe(20)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(20)
    // リンク結果
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    // 経験値
    let dSheena = getAccessDenco(result, "offense")
    let dCharlotte = getAccessDenco(result, "defense")
    expect(dSheena.exp.access.accessBonus).toBe(100)
    expect(dSheena.exp.access.damageBonus).toBe(dCharlotte.damage!.value)
    expect(dSheena.exp.access.linkBonus).toBe(0)
    expect(dSheena.exp.access.total).toBe(100 + dCharlotte.damage!.value) // 開始・ダメージ
    expect(dSheena.exp.link).toBe(0)
    expect(dSheena.exp.skill).toBe(0)
    expect(dSheena.exp.total).toBe(dSheena.exp.access.total)
    expect(dSheena.currentExp).toBe(dSheena.exp.total)
    expect(dCharlotte.currentExp).toBe(0)
  })

  test("発動なし-守備側-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    const offense = initUser(context, "とあるマスター１", [
      charlotte
    ])
    const defense = initUser(context, "とあるマスター２", [
      sheena
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
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // 発動なし
    expect(hasSkillTriggered(result, "defense", sheena)).toBe(false)
    let t = getSkillTrigger(result, "defense", sheena)[0]
    assert(t)
    expect(t.probability).toBe(6.5)
    expect(t.boostedProbability).toBe(6.5)
    expect(t.canTrigger).toBe(false)
    expect(t.invalidated).toBe(false)
    expect(t.triggered).toBe(false)
    // ダメージ計算
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(170)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(94)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(94)
    // リンク結果
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })
  test("発動なし-守備側-リブート", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    const offense = initUser(context, "とあるマスター１", [
      charlotte
    ])
    const defense = initUser(context, "とあるマスター２", [
      sheena
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
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    assert(result.defense)
    expect(result.defense.event.length).toBe(2)
    expect(result.defense.event[0].type).toBe("access")
    expect(result.defense.event[1].type).toBe("reboot")

    // 発動なし
    expect(hasSkillTriggered(result, "defense", sheena)).toBe(false)
    let t = getSkillTrigger(result, "defense", sheena)
    expect(t.length).toBe(0)
    // ダメージ計算
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(270)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(0)
    expect(d.reboot).toBe(true)
    expect(d.currentHp).toBe(264)
    // リンク結果
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    // 経験値
    let dSheena = getAccessDenco(result, "defense")
    let dCharlotte = getAccessDenco(result, "offense")
    expect(dSheena.exp.access.total).toBe(0)
    expect(dSheena.exp.link).toBeGreaterThan(0)
    expect(dSheena.exp.link).toBe(dSheena.disconnectedLink!.exp)
    expect(dSheena.exp.skill).toBe(0)
    expect(dSheena.exp.total).toBe(dSheena.exp.link)
    expect(dSheena.currentExp).toBe(dSheena.exp.link)
    expect(dCharlotte.exp.access.accessBonus).toBe(100)
    expect(dCharlotte.exp.access.linkBonus).toBe(100)
    expect(dCharlotte.exp.access.damageBonus).toBe(dSheena.damage!.value)
    expect(dCharlotte.exp.access.total).toBe(100 + dSheena.damage!.value + 100) // 開始・ダメージ・成功
    expect(dCharlotte.exp.link).toBe(0)
    expect(dCharlotte.exp.skill).toBe(0)
    expect(dCharlotte.exp.total).toBe(dCharlotte.exp.access.total)
    expect(dCharlotte.currentExp).toBe(charlotte.nextExp) // 最大レベル80
  })

  test("発動あり-守備側", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    const offense = initUser(context, "とあるマスター１", [
      charlotte
    ])
    const defense = initUser(context, "とあるマスター２", [
      sheena
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
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // 発動あり
    expect(hasSkillTriggered(result, "defense", sheena)).toBe(true)
    let t = getSkillTrigger(result, "defense", sheena)[0]
    assert(t)
    expect(t.probability).toBe(6.5)
    expect(t.boostedProbability).toBe(6.5)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
    // ダメージ計算
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(170)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(94)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(94)
    d = getAccessDenco(result, "offense")
    expect(d.damage?.value).toBe(208)
    expect(d.damage?.attr).toBe(true)
    expect(d.hpBefore).toBe(228)
    expect(d.hpAfter).toBe(20)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(20)
    // リンク結果
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    // 経験値
    let dSheena = getAccessDenco(result, "defense")
    let dCharlotte = getAccessDenco(result, "offense")
    expect(dSheena.exp.access.accessBonus).toBe(0)
    expect(dSheena.exp.access.damageBonus).toBe(dCharlotte.damage!.value)
    expect(dSheena.exp.access.linkBonus).toBe(0)
    expect(dSheena.exp.access.total).toBe(dCharlotte.damage!.value) // ダメージ
    expect(dSheena.exp.link).toBe(0)
    expect(dSheena.exp.skill).toBe(0)
    expect(dSheena.exp.total).toBe(dSheena.exp.access.total)
    expect(dSheena.currentExp).toBe(dSheena.exp.access.total)
    expect(dCharlotte.exp.access.accessBonus).toBe(100)
    expect(dCharlotte.exp.access.damageBonus).toBe(dSheena.damage!.value)
    expect(dCharlotte.exp.access.linkBonus).toBe(0)
    expect(dCharlotte.exp.access.total).toBe(100 + dSheena.damage!.value) // 開始・ダメージ
    expect(dCharlotte.exp.link).toBe(0)
    expect(dCharlotte.exp.skill).toBe(0)
    expect(dCharlotte.exp.total).toBe(dCharlotte.exp.access.total)
    expect(dCharlotte.currentExp).toBe(dCharlotte.exp.access.total)
  })
  test("発動あり-守備側-ATK/DEF増減", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let offense = initUser(context, "とあるマスター１", [
      charlotte, fubu
    ])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [
      sheena, reika
    ])
    defense = activateSkill(context, defense, 1)
    const config: AccessConfig = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // 発動あり
    expect(hasSkillTriggered(result, "defense", sheena)).toBe(true)
    expect(hasSkillTriggered(result, "defense", reika)).toBe(true)
    expect(hasSkillTriggered(result, "offense", fubu)).toBe(true)
    // 反撃時のATK,DEFは反映されていない
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // ダメージ計算
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(170)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(94)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(94)
    d = getAccessDenco(result, "offense")
    expect(d.damage?.value).toBe(220)
    expect(d.damage?.attr).toBe(true)
    expect(d.hpBefore).toBe(228)
    expect(d.hpAfter).toBe(8)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(8)
    // リンク結果
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })

  test("発動あり-守備側-ひいる", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    const offense = initUser(context, "とあるマスター１", [
      charlotte
    ])
    let defense = initUser(context, "とあるマスター２", [
      sheena, hiiru
    ])
    defense = activateSkill(context, defense, 1)
    const config: AccessConfig = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // 発動あり
    expect(hasSkillTriggered(result, "defense", sheena)).toBe(true)
    expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)
    let t = getSkillTrigger(result, "defense", sheena)[0]
    assert(t)
    expect(t.probability).toBe(6.5)
    expect(t.boostedProbability).toBe(6.5 * 1.2)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
    // ダメージ計算
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(170)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(94)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(94)
    d = getAccessDenco(result, "offense")
    expect(d.damage?.value).toBe(208)
    expect(d.damage?.attr).toBe(true)
    expect(d.hpBefore).toBe(228)
    expect(d.hpAfter).toBe(20)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(20)
    // リンク結果
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })
  test("発動なし-守備側-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    const offense = initUser(context, "とあるマスター１", [
      charlotte
    ])
    let defense = initUser(context, "とあるマスター２", [
      sheena, hiiru
    ])
    defense = activateSkill(context, defense, 1)
    const config: AccessConfig = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // 発動なし ただし確率補正は発動
    expect(hasSkillTriggered(result, "defense", sheena)).toBe(false)
    expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)
    let t = getSkillTrigger(result, "defense", sheena)[0]
    assert(t)
    expect(t.probability).toBe(6.5)
    expect(t.boostedProbability).toBe(6.5 * 1.2)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    // ダメージ計算
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(170)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(94)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(94)
    // リンク結果
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
  })
})