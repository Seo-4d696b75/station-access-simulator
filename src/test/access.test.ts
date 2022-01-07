import StationManager from "../core/stationManager"
import SkillManager from "../core/skillManager"
import DencoManager from "../core/dencoManager"
import { initContext } from "../core/context"
import { AccessConfig, AccessState, getAccessDenco, startAccess } from "../core/access"

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
    const reika = DencoManager.getDenco(context, "5", 50)
    const charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const config: AccessConfig = {
      offense: {
        carIndex: 0,
        formation: [
          reika,
          charlotte
        ]
      },
      station: StationManager.getRandomStation(context, 1)[0]
    }
    const result = startAccess(context, config)
    expect(result.event.length).toBeGreaterThan(0)
    expect(result.event[0].type).toBe("access")
    const access = result.event[0].data as AccessState
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
    expect(d.hpBefore).toBe(reika.currentHp)
    expect(d.hpAfter).toBe(reika.currentHp)
    expect(d.currentHp).toBe(reika.currentHp)
    expect(d.currentExp).toBe(reika.currentExp + access.offense.exp)
  })
})