import StationManager from "../core/stationManager"
import SkillManager from "../core/skillManager"
import DencoManager from "../core/dencoManager"
import { initContext } from "../core/context"
import { AccessConfig, getAccessDenco, getDefense, startAccess } from "../core/access"
import { getTargetDenco, initUser } from "../core/user"
import { LinksResult } from "../core/station"
import { activateSkill } from "../core/skill"
import { Event } from "../core/event"

describe("基本的なアクセス処理", () => {
  test("load", async () => {
    await StationManager.load()
    await SkillManager.load()
    await DencoManager.load()
    expect(StationManager.data.length).toBeGreaterThan(0)
    expect(SkillManager.map.size).toBeGreaterThan(0)
    expect(DencoManager.data.size).toBeGreaterThan(0)
  })
  test("守備側なし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    const offense = initUser(context, "とあるマスター１", [
      reika
    ])
    const config: AccessConfig = {
      offense: {
        carIndex: 0,
        ...offense
      },
      station: StationManager.getRandomStation(context, 1)[0],
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.offense.event[0].type).toBe("access")
    expect(result.defense).toBeUndefined()
    const access = result.access
    // 不在の確認
    expect(access.defense).toBeUndefined()
    // アクセス結果の確認
    expect(access.linkSuccess).toBe(true)
    expect(access.linkDisconncted).toBe(false)
    // アクセス処理の確認
    expect(access.pinkMode).toBe(false)
    expect(access.pinkItemSet).toBe(false)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.attackPercent).toBe(0)
    expect(access.defendPercent).toBe(0)
    expect(access.damageBase).toBeUndefined()
    expect(access.damageFixed).toBe(0)
    const d = getAccessDenco(access, "offense")
    expect(d.name).toBe(reika.name)
    expect(d.numbering).toBe(reika.numbering)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(192)
    expect(d.currentHp).toBe(192)
    expect(d.currentExp).toBe(reika.currentExp + access.offense.exp)
    expect(() => getAccessDenco(access, "defense")).toThrowError()
  })
  test("守備側なし-フットバースあり", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    const offense = initUser(context, "とあるマスター１", [
      reika
    ])
    const config: AccessConfig = {
      offense: {
        carIndex: 0,
        ...offense
      },
      station: StationManager.getRandomStation(context, 1)[0],
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.offense.event[0].type).toBe("access")
    expect(result.defense).toBeUndefined()
    const access = result.access
    // 不在の確認
    expect(access.defense).toBeUndefined()
    // アクセス結果の確認
    expect(access.linkSuccess).toBe(true)
    expect(access.linkDisconncted).toBe(false)
    expect(access.pinkItemSet).toBe(true)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.pinkMode).toBe(false)
  })
  test("守備側あり-スキル発動なし-Rebootなし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika
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
    // 相手の確認
    expect(access.defense).not.toBeUndefined()
    // アクセス結果の確認
    expect(access.linkSuccess).toBe(false)
    expect(access.linkDisconncted).toBe(false)
    // アクセス処理の確認
    expect(access.pinkMode).toBe(false)
    expect(access.pinkItemSet).toBe(false)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.attackPercent).toBe(0)
    expect(access.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(access.damageBase).toBe(260)
    expect(access.damageFixed).toBe(0)
    expect(access.offense.damage).toBeUndefined()
    expect(access.defense?.damage?.value).toBe(260)
    expect(access.defense?.damage?.attr).toBe(true)
    let d = getAccessDenco(access, "offense")
    expect(d.name).toBe(reika.name)
    expect(d.numbering).toBe(reika.numbering)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(192)
    expect(d.currentHp).toBe(192)
    expect(d.currentExp).toBe(reika.currentExp + access.offense.exp)
    expect(d.ap).toBe(200)
    d = getAccessDenco(access, "defense")
    let def = getDefense(access)
    expect(d.name).toBe(charlotte.name)
    expect(d.numbering).toBe(charlotte.numbering)
    expect(d.hpBefore).toBe(324)
    expect(d.hpAfter).toBe(64)
    expect(d.currentHp).toBe(64)
    expect(d.currentExp).toBe(charlotte.currentExp + def.exp)
  })


  test("守備側あり-フットバースあり", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika
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
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    const access = result.access
    // 相手の確認
    expect(access.defense).not.toBeUndefined()
    // アクセス結果の確認
    expect(access.linkSuccess).toBe(true)
    expect(access.linkDisconncted).toBe(true)
    // アクセス処理の確認
    expect(access.pinkMode).toBe(true)
    expect(access.pinkItemSet).toBe(true)
    expect(access.pinkItemUsed).toBe(true)
    // ダメージ計算確認
    expect(access.damageBase).toBeUndefined()
    expect(access.damageFixed).toBe(0)
    expect(access.offense.damage).toBeUndefined()
    expect(access.defense?.damage).toBeUndefined()
    // 最終状態の確認
    expect(result.defense).not.toBeUndefined()
    if (result.defense) {
      const charlotteResult = getTargetDenco(result.defense)
      charlotte = defense.formation[0]
      expect(charlotteResult).toMatchObject({
        ...charlotte,
        link: charlotte.link.slice(1),
        currentExp: charlotte.currentExp + getDefense(access).exp,
      })
    }
  })

  test("守備側あり-スキル発動なし-Rebootあり", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 80)
    let charlotte = DencoManager.getDenco(context, "6", 50, 3)
    const offense = initUser(context, "とあるマスター１", [
      reika
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
    expect(result.defense?.event.length).toBe(2)
    const access = result.access
    // 相手の確認
    expect(access.defense).not.toBeUndefined()
    // アクセス結果の確認
    expect(access.linkSuccess).toBe(true)
    expect(access.linkDisconncted).toBe(true)
    // アクセス処理の確認
    expect(access.pinkMode).toBe(false)
    expect(access.pinkItemSet).toBe(false)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.attackPercent).toBe(0)
    expect(access.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(access.damageBase).toBe(338)
    expect(access.damageFixed).toBe(0)
    expect(access.offense.damage).toBeUndefined()
    expect(access.defense?.damage?.value).toBe(338)
    expect(access.defense?.damage?.attr).toBe(true)
    let d = getAccessDenco(access, "offense")
    expect(d.name).toBe(reika.name)
    expect(d.numbering).toBe(reika.numbering)
    expect(d.hpBefore).toBe(312)
    expect(d.hpAfter).toBe(312)
    expect(d.currentHp).toBe(312)
    expect(d.currentExp).toBe(reika.currentExp + access.offense.exp)
    expect(d.ap).toBe(260)
    d = getAccessDenco(access, "defense")
    let def = getDefense(access)
    expect(d.name).toBe(charlotte.name)
    expect(d.numbering).toBe(charlotte.numbering)
    expect(d.hpBefore).toBe(228)
    expect(d.hpAfter).toBe(0)
    expect(d.currentHp).toBe(228)
    // アクセスのEXP
    expect(d.currentExp).toBe(charlotte.currentExp + def.exp)
    // リブート確認
    let e = result.defense?.event[1]
    expect(e).not.toBeUndefined()
    expect(e?.type === "reboot")
    let data = e?.data as LinksResult
    expect(data.denco.name).toBe(charlotte.name)
    expect(data.link.length).toBe(3)
    expect(data.link[0]).toMatchObject(charlotte.link[0])
    expect(data.link[1]).toMatchObject(charlotte.link[1])
    expect(data.link[2]).toMatchObject(charlotte.link[2])
    // アクセス後の状態
    expect(result.defense).not.toBeUndefined()
    if (result.defense) {
      charlotte = defense.formation[0]
      let charlotteResult = getTargetDenco(result.defense)
      expect(charlotteResult).toMatchObject({
        ...charlotte,
        currentExp: charlotte.currentExp + getDefense(access).exp + data.exp,
        link: [],
      })
      reika = offense.formation[0]
      let reikaResult = getTargetDenco(result.offense)
      expect(reikaResult).toMatchObject({
        ...reika,
        currentExp: reika.currentExp + access.offense.exp,
      })
    }
  })


  test("守備側あり-スキル発動あり-Rebootなし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 30)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    let offense = initUser(context, "とあるマスター１", [
      reika
    ])
    offense = activateSkill(context, {
      ...offense,
      carIndex: 0,
    })
    let defense = initUser(context, "とあるマスター２", [
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
    // 相手の確認
    expect(access.defense).not.toBeUndefined()
    // アクセス結果の確認
    expect(access.linkSuccess).toBe(false)
    expect(access.linkDisconncted).toBe(false)
    // アクセス処理の確認
    expect(access.pinkMode).toBe(false)
    expect(access.pinkItemSet).toBe(false)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.attackPercent).toBe(20)
    expect(access.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(access.damageBase).toBe(180)
    expect(access.damageFixed).toBe(0)
    expect(access.offense.damage).toBeUndefined()
    expect(access.defense?.damage?.value).toBe(180)
    expect(access.defense?.damage?.attr).toBe(true)
    let d = getAccessDenco(access, "offense")
    expect(d.name).toBe("reika")
    expect(d.hpBefore).toBe(165)
    expect(d.hpAfter).toBe(165)
    expect(d.currentHp).toBe(165)
    expect(access.offense.triggeredSkills.length).toBe(1)
    expect(access.offense.triggeredSkills[0].name).toBe("reika")
    expect(access.offense.triggeredSkills[0].step).toBe("damage_common")
    d = getAccessDenco(access, "defense")
    expect(d.name).toBe("charlotte")
    expect(d.hpBefore).toBe(324)
    expect(d.hpAfter).toBe(144)
    expect(d.currentHp).toBe(144)
  })


  test("守備側あり-スキル確率発動なし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let sheena = DencoManager.getDenco(context, "7", 50, 3)
    let offense = initUser(context, "とあるマスター１", [
      reika
    ])
    let defense = initUser(context, "とあるマスター２", [
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
    context.random.mode = "ignore"
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    const access = result.access
    // 相手の確認
    expect(access.defense).not.toBeUndefined()
    // アクセス結果の確認
    expect(access.linkSuccess).toBe(false)
    expect(access.linkDisconncted).toBe(false)
    // アクセス処理の確認
    expect(access.pinkMode).toBe(false)
    expect(access.pinkItemSet).toBe(false)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.attackPercent).toBe(0)
    expect(access.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(access.damageBase).toBe(200)
    expect(access.damageFixed).toBe(0)
    expect(access.offense.damage).toBeUndefined()
    expect(access.defense?.damage?.value).toBe(200)
    expect(access.defense?.damage?.attr).toBe(false)
    expect(access.offense.triggeredSkills.length).toBe(0)
    expect(access.defense?.triggeredSkills.length).toBe(0)
    let d = getAccessDenco(access, "defense")
    expect(d.name).toBe("sheena")
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(64)
    expect(d.currentHp).toBe(64)
  })


  test("守備側あり-カウンター攻撃あり", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let sheena = DencoManager.getDenco(context, "7", 50, 3)
    let offense = initUser(context, "とあるマスター１", [
      reika
    ])
    let defense = initUser(context, "とあるマスター２", [
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
    context.random.mode = "force"
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    const access = result.access
    // 相手の確認
    expect(access.defense).not.toBeUndefined()
    // アクセス結果の確認
    expect(access.linkSuccess).toBe(false)
    expect(access.linkDisconncted).toBe(false)
    // アクセス処理の確認
    expect(access.pinkMode).toBe(false)
    expect(access.pinkItemSet).toBe(false)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.attackPercent).toBe(0)
    expect(access.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(access.defense?.damage?.value).toBe(200)
    expect(access.defense?.damage?.attr).toBe(false)
    expect(access.offense.damage).not.toBeUndefined()
    expect(access.offense.damage?.value).toBe(160)
    expect(access.offense.damage?.attr).toBe(false)
    expect(access.offense.triggeredSkills.length).toBe(0)
    expect(access.defense?.triggeredSkills.length).toBe(1)
    expect(access.defense?.triggeredSkills[0].name).toBe("sheena")
    expect(access.defense?.triggeredSkills[0].step).toBe("after_damage")
    let d = getAccessDenco(access, "defense")
    expect(d.name).toBe("sheena")
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(64)
    expect(d.currentHp).toBe(64)
    d = getAccessDenco(access, "offense")
    expect(d.name).toBe("reika")
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(32)
    expect(d.currentHp).toBe(32)
  })



  test("守備側あり-カウンター攻撃あり-Rebootあり", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let sheena = DencoManager.getDenco(context, "7", 80, 3)
    let offense = initUser(context, "とあるマスター１", [
      reika
    ])
    let defense = initUser(context, "とあるマスター２", [
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
    context.random.mode = "force"
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(2)
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    const access = result.access
    // 相手の確認
    expect(access.defense).not.toBeUndefined()
    // アクセス結果の確認
    expect(access.linkSuccess).toBe(false)
    expect(access.linkDisconncted).toBe(false)
    // アクセス処理の確認
    expect(access.pinkMode).toBe(false)
    expect(access.pinkItemSet).toBe(false)
    expect(access.pinkItemUsed).toBe(false)
    expect(access.attackPercent).toBe(0)
    expect(access.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(access.defense?.damage?.value).toBe(200)
    expect(access.defense?.damage?.attr).toBe(false)
    expect(access.offense.damage).not.toBeUndefined()
    expect(access.offense.damage?.value).toBe(250)
    expect(access.offense.damage?.attr).toBe(false)
    expect(access.offense.triggeredSkills.length).toBe(0)
    expect(access.defense?.triggeredSkills.length).toBe(1)
    expect(access.defense?.triggeredSkills[0].name).toBe("sheena")
    expect(access.defense?.triggeredSkills[0].step).toBe("after_damage")
    let d = getAccessDenco(access, "defense")
    expect(d.name).toBe("sheena")
    expect(d.hpBefore).toBe(420)
    expect(d.hpAfter).toBe(220)
    expect(d.currentHp).toBe(220)
    d = getAccessDenco(access, "offense")
    expect(d.name).toBe("reika")
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.currentHp).toBe(192)
    let e = result.offense.event[1] as Event
    expect(e.type).toBe("reboot")
    let reboot = e.data as LinksResult
    expect(reboot.link.length).toBe(1)
    expect(reboot.link[0]).toMatchObject(reika.link[0])
    // リンク解除確認
    let reikaResult = getTargetDenco(result.offense)
    expect(reikaResult.link.length).toBe(0)
  })
})