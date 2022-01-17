import { initContext } from "../core/context"
import StationManager from "../core/stationManager"
import SkillManager from "../core/skillManager"
import DencoManager from "../core/dencoManager"
import { AccessEventData, LevelupDenco } from "../core/event"
import { initUser, refreshEXPState } from "../core/user"
import { AccessConfig, getDefense, startAccess } from "../core/access"
import { LinksResult } from "../core/station"
import { refreshSkillState } from "../core/skill"

describe("経験値の処理", () => {
  test("setup", async () => {
    await StationManager.load()
    await SkillManager.load()
    await DencoManager.load()
  })
  test("レベルアップ1", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 1)
    expect(reika.level).toBe(1)
    expect(reika.currentExp).toBe(0)
    expect(reika.nextExp).toBe(400)
    reika = {
      ...reika,
      currentExp: 500
    }
    let state = initUser(context, "とあるマスター１", [
      reika
    ])
    const time = Date.now()
    context.clock = time
    state = refreshEXPState(context, state)
    let current = state.formation[0]
    expect(current.level).toBe(2)
    expect(current.currentExp).toBe(100)

    expect(state.event.length).toBe(1)
    const event = state.event[0]
    expect(event.type).toBe("levelup")
    const data = event.data as LevelupDenco
    expect(data.time).toBe(time)
    expect(data.before).toMatchObject(reika)
    expect(data.after).toMatchObject(current)
  })
  test("レベルアップ2", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 10)
    expect(reika.level).toBe(10)
    expect(reika.currentExp).toBe(0)
    expect(reika.nextExp).toBe(4900)
    let state = initUser(context, "とあるマスター１", [
      reika
    ])
    const time = Date.now()
    context.clock = time
    state = refreshSkillState(context, state)
    reika = state.formation[0]
    reika.currentExp = 44758
    state = refreshEXPState(context, state)
    let current = state.formation[0]
    expect(current.level).toBe(16)
    expect(current.currentExp).toBe(5858)

    expect(state.event.length).toBe(1)
    const event = state.event[0]
    expect(event.type).toBe("levelup")
    const data = event.data as LevelupDenco
    expect(data.time).toBe(time)
    expect(data.before).toMatchObject(reika)
    expect(data.after).toMatchObject(current)
  })
  test("アクセス-Reboot-レベルアップ", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 10, 3)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    expect(reika.level).toBe(10)
    expect(reika.currentExp).toBe(0)
    expect(reika.nextExp).toBe(4900)
    const offense = initUser(context, "とあるマスター１", [
      charlotte
    ])
    let defense = initUser(context, "とあるマスター２", [
      reika
    ])
    defense = refreshSkillState(context, defense)
    reika = defense.formation[0]
    const config: AccessConfig = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    if (result.defense) {
      const state = result.defense
      // アクセス終了直後（レベルアップ前）
      expect(state.event.length).toBe(3)
      let event = state.event[0]
      expect(event.type).toBe("access")
      const accessResult = event.data as AccessEventData
      let defense = getDefense(accessResult.access)
      const accessEXP = defense.exp
      reika = {
        ...reika,
        currentExp: accessEXP
      }
      expect(defense.formation[0]).toMatchObject(reika)
      expect(defense.exp).toBe(accessEXP)
      // リブート
      event = state.event[1]
      expect(event.type).toBe("reboot")
      const links = event.data as LinksResult
      const linksEXP = links.exp
      expect(links.denco).toMatchObject(reika)
      // レベルアップ
      event = state.event[2]
      expect(event.type).toBe("levelup")
      const levelup = event.data as LevelupDenco
      reika = {
        ...reika,
        link: [],
        currentExp: accessEXP + linksEXP
      }
      expect(levelup.before).toMatchObject(reika)
      // レベルアップ後の状態
      let tmp = initUser(context, "hoge", [reika])
      tmp = refreshEXPState(context, tmp)
      reika = tmp.formation[0]
      // 最終状態
      const current = result.defense.formation[0]
      expect(current.level).toBe(reika.level)
      expect(current.currentExp).toBe(reika.currentExp)
      expect(levelup.after).toMatchObject(current)
    }
  })
})