import StationManager from "../core/stationManager"
import SkillManager from "../core/skillManager"
import DencoManager from "../core/dencoManager"
import { initContext } from "../core/context"
import { AccessConfig, AccessState, getAccessDenco, getDefense, startAccess } from "../core/access"
import { initUser } from "../core/user"

describe("access", () => {
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
    const offense = initUser("とあるマスター１", [
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
  })

  test("守備側あり-スキル発動なし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser("とあるマスター１", [
      reika
    ])
    const defense = initUser("とあるマスター２", [
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
})