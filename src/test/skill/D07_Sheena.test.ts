import { init } from "../.."
import { AccessConfig, getAccessDenco, getDefense, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../skillState"

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
    expect(result.offense.triggeredSkills.length).toBe(0)
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
    d = getAccessDenco(result, "offense")
    expect(d.currentExp).toBe(sheena.currentExp + d.exp.access + d.exp.skill)
    d = getAccessDenco(result, "defense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.exp.access + d.exp.skill)
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
    expect(result.defense?.triggeredSkills.length).toBe(0)
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
    // 経験値
    d = getAccessDenco(result, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.exp.access + d.exp.skill)
    d = getAccessDenco(result, "defense")
    expect(d.currentExp).toBe(sheena.currentExp + d.exp.access + d.exp.skill)
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
    if (result.defense) {
      expect(result.defense.event.length).toBe(2)
      expect(result.defense.event[0].type).toBe("access")
      expect(result.defense.event[1].type).toBe("reboot")
    }
    // 発動なし
    expect(result.defense?.triggeredSkills.length).toBe(0)
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
    d = getAccessDenco(result, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.exp.access + d.exp.skill)
    d = getAccessDenco(result, "defense")
    expect(d.currentExp).toBe(sheena.currentExp + d.exp.access + d.exp.skill + (d.disconnectedLink?.exp ?? 0))
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
    let side = getDefense(result)
    expect(side.triggeredSkills.length).toBe(1)
    expect(side.triggeredSkills[0].name).toBe("sheena")
    expect(side.triggeredSkills[0].step).toBe("after_damage")
    side = result.offense
    expect(side.triggeredSkills.length).toBe(0)
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
    d = getAccessDenco(result, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.exp.access + d.exp.skill)
    d = getAccessDenco(result, "defense")
    expect(d.exp.access).toBeGreaterThan(0)
    expect(d.currentExp).toBe(sheena.currentExp + d.exp.access + d.exp.skill)
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
    let side = getDefense(result)
    expect(side.triggeredSkills.length).toBe(2)
    expect(side.triggeredSkills[0].name).toBe("sheena")
    expect(side.triggeredSkills[0].step).toBe("after_damage")
    expect(side.triggeredSkills[1].name).toBe("reika")
    expect(side.triggeredSkills[1].step).toBe("damage_common")
    side = result.offense
    expect(side.triggeredSkills.length).toBe(1)
    expect(side.triggeredSkills[0].name).toBe("fubu")
    expect(side.triggeredSkills[0].step).toBe("damage_common")
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
    // 経験値
    d = getAccessDenco(result, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.exp.access + d.exp.skill)
    d = getAccessDenco(result, "defense")
    expect(d.exp.access).toBeGreaterThan(0)
    expect(d.currentExp).toBe(sheena.currentExp + d.exp.access + d.exp.skill)
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
    let side = getDefense(result)
    expect(side.triggeredSkills.length).toBe(2)
    expect(side.triggeredSkills[0].name).toBe("hiiru")
    expect(side.triggeredSkills[0].step).toBe("probability_check")
    expect(side.triggeredSkills[1].name).toBe("sheena")
    expect(side.triggeredSkills[1].step).toBe("after_damage")
    side = result.offense
    expect(side.triggeredSkills.length).toBe(0)
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
    d = getAccessDenco(result, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.exp.access + d.exp.skill)
    d = getAccessDenco(result, "defense")
    expect(d.exp.access).toBeGreaterThan(0)
    expect(d.currentExp).toBe(sheena.currentExp + d.exp.access + d.exp.skill)
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
    expect(result.defense?.triggeredSkills.length).toBe(1)
    expect(result.defense?.triggeredSkills[0].name).toBe("hiiru")
    expect(result.defense?.triggeredSkills[0].step).toBe("probability_check")
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
    // 経験値
    d = getAccessDenco(result, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.exp.access + d.exp.skill)
    d = getAccessDenco(result, "defense")
    expect(d.currentExp).toBe(sheena.currentExp + d.exp.access + d.exp.skill)
  })
})