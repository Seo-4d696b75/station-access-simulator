import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { initContext } from "../../core/context"
import { initUser } from "../../core/user"
import { activateSkill, disactivateSkill, getSkill } from "../../core/skill"
import { AccessConfig, getAccessDenco, getDefense, startAccess } from "../../core/access"

describe("シーナのスキル", () => {
  test("setup", async () => {
    await StationManager.load()
    await SkillManager.load()
    await DencoManager.load()
    expect(StationManager.data.length).toBeGreaterThan(0)
    expect(SkillManager.map.size).toBeGreaterThan(0)
    expect(DencoManager.data.size).toBeGreaterThan(0)
  })
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let sheena = DencoManager.getDenco(context, "7", 1)
    expect(sheena.skill.type).toBe("not_acquired")
    sheena = DencoManager.getDenco(context, "7", 50)
    expect(sheena.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [sheena])
    sheena = state.formation[0]
    let skill = getSkill(sheena)
    expect(skill.state.type).toBe("active")
    expect(skill.state.transition).toBe("always")
    expect(() => activateSkill(context, { ...state, carIndex: 0 })).toThrowError()
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 })).toThrowError()
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
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    const access = result.access
    // 発動なし
    expect(access.offense.triggeredSkills.length).toBe(0)
    // ダメージ計算
    let d = getAccessDenco(access, "defense")
    expect(d.damage?.value).toBe(208)
    expect(d.damage?.attr).toBe(true)
    expect(d.hpBefore).toBe(228)
    expect(d.hpAfter).toBe(20)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(20)
    // リンク結果
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
    // 経験値
    d = getAccessDenco(access, "offense")
    expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP)
    d = getAccessDenco(access, "defense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP)
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
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    const access = result.access
    // 発動なし
    expect(access.defense?.triggeredSkills.length).toBe(0)
    // ダメージ計算
    let d = getAccessDenco(access, "defense")
    expect(d.damage?.value).toBe(170)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(94)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(94)
    // リンク結果
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
    // 経験値
    d = getAccessDenco(access, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP)
    d = getAccessDenco(access, "defense")
    expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP)
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
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
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
    const access = result.access
    // 発動なし
    expect(access.defense?.triggeredSkills.length).toBe(0)
    // ダメージ計算
    let d = getAccessDenco(access, "defense")
    expect(d.damage?.value).toBe(270)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(0)
    expect(d.reboot).toBe(true)
    expect(d.currentHp).toBe(264)
    // リンク結果
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    // 経験値
    d = getAccessDenco(access, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP)
    d = getAccessDenco(access, "defense")
    expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP)
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
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    const access = result.access
    // 発動あり
    let side = getDefense(access)
    expect(side.triggeredSkills.length).toBe(1)
    expect(side.triggeredSkills[0].name).toBe("sheena")
    expect(side.triggeredSkills[0].step).toBe("after_damage")
    side = access.offense
    expect(side.triggeredSkills.length).toBe(0)
    // ダメージ計算
    let d = getAccessDenco(access, "defense")
    expect(d.damage?.value).toBe(170)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(94)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(94)
    d = getAccessDenco(access, "offense")
    expect(d.damage?.value).toBe(208)
    expect(d.damage?.attr).toBe(true)
    expect(d.hpBefore).toBe(228)
    expect(d.hpAfter).toBe(20)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(20)
    // リンク結果
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
    // 経験値
    d = getAccessDenco(access, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP)
    d = getAccessDenco(access, "defense")
    expect(d.accessEXP).toBeGreaterThan(0)
    expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP)
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
    offense = activateSkill(context, { ...offense, carIndex: 1 })
    let defense = initUser(context, "とあるマスター２", [
      sheena, reika
    ])
    defense = activateSkill(context, { ...defense, carIndex: 1 })
    const config: AccessConfig = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    const access = result.access
    // 発動あり
    let side = getDefense(access)
    expect(side.triggeredSkills.length).toBe(2)
    expect(side.triggeredSkills[0].name).toBe("sheena")
    expect(side.triggeredSkills[0].step).toBe("after_damage")
    expect(side.triggeredSkills[1].name).toBe("reika")
    expect(side.triggeredSkills[1].step).toBe("damage_common")
    side = access.offense
    expect(side.triggeredSkills.length).toBe(1)
    expect(side.triggeredSkills[0].name).toBe("fubu")
    expect(side.triggeredSkills[0].step).toBe("damage_common")
    // ダメージ計算
    let d = getAccessDenco(access, "defense")
    expect(d.damage?.value).toBe(170)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(94)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(94)
    d = getAccessDenco(access, "offense")
    expect(d.damage?.value).toBe(220)
    expect(d.damage?.attr).toBe(true)
    expect(d.hpBefore).toBe(228)
    expect(d.hpAfter).toBe(8)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(8)
    // リンク結果
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
    // 経験値
    d = getAccessDenco(access, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP)
    d = getAccessDenco(access, "defense")
    expect(d.accessEXP).toBeGreaterThan(0)
    expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP)
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
    defense = activateSkill(context, { ...defense, carIndex: 1 })
    const config: AccessConfig = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    const access = result.access
    // 発動あり
    let side = getDefense(access)
    expect(side.triggeredSkills.length).toBe(2)
    expect(side.triggeredSkills[0].name).toBe("hiiru")
    expect(side.triggeredSkills[0].step).toBe("probability_check")
    expect(side.triggeredSkills[1].name).toBe("sheena")
    expect(side.triggeredSkills[1].step).toBe("after_damage")
    side = access.offense
    expect(side.triggeredSkills.length).toBe(0)
    // ダメージ計算
    let d = getAccessDenco(access, "defense")
    expect(d.damage?.value).toBe(170)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(94)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(94)
    d = getAccessDenco(access, "offense")
    expect(d.damage?.value).toBe(208)
    expect(d.damage?.attr).toBe(true)
    expect(d.hpBefore).toBe(228)
    expect(d.hpAfter).toBe(20)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(20)
    // リンク結果
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
    // 経験値
    d = getAccessDenco(access, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP)
    d = getAccessDenco(access, "defense")
    expect(d.accessEXP).toBeGreaterThan(0)
    expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP)
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
    defense = activateSkill(context, { ...defense, carIndex: 1 })
    const config: AccessConfig = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: sheena.link[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    const access = result.access
    // 発動なし ただし確率補正は発動
    expect(access.defense?.triggeredSkills.length).toBe(1)
    expect(access.defense?.triggeredSkills[0].name).toBe("hiiru")
    expect(access.defense?.triggeredSkills[0].step).toBe("probability_check")
    // ダメージ計算
    let d = getAccessDenco(access, "defense")
    expect(d.damage?.value).toBe(170)
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(94)
    expect(d.reboot).toBe(false)
    expect(d.currentHp).toBe(94)
    // リンク結果
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
    // 経験値
    d = getAccessDenco(access, "offense")
    expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP)
    d = getAccessDenco(access, "defense")
    expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP)
  })
})