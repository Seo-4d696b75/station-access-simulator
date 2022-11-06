import moment from "moment-timezone"
import { init } from ".."
import { AccessConfig, getDefense, startAccess } from "../core/access/index"
import { initContext } from "../core/context"
import DencoManager from "../core/dencoManager"
import { AccessEventData, LevelupDenco } from "../core/event"
import { LinksResult } from "../core/station"
import { initUser, refreshState } from "../core/user"

describe("経験値の処理", () => {
  beforeAll(init)
  test("レベルアップ1", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 1)
    expect(reika.level).toBe(1)
    expect(reika.currentExp).toBe(0)
    expect(reika.nextExp).toBe(400)
    let state = initUser(context, "とあるマスター１", [
      reika
    ])
    const time = moment().valueOf()
    context.clock = time
    reika = state.formation[0]
    reika.currentExp = 500
    state = refreshState(context, state)
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
    const time = moment().valueOf()
    context.clock = time
    state = refreshState(context, state)
    reika = state.formation[0]
    reika.currentExp = 44758
    state = refreshState(context, state)
    let current = state.formation[0]
    expect(current.level).toBe(16)
    expect(current.currentExp).toBe(5858)

    expect(state.event.length).toBe(1)
    const event = state.event[0]
    expect(event.type).toBe("levelup")
    const data = event.data as LevelupDenco
    expect(data.time).toBe(time.valueOf())
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
    reika = defense.formation[0]
    const config: AccessConfig = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
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
      let afterAccess = getDefense(accessResult.access).formation[0]
      // リブート
      event = state.event[1]
      expect(event.type).toBe("reboot")
      const links = event.data as LinksResult
      const linksEXP = links.exp
      expect(links.denco).toMatchObject({
        ...reika,
        link: []  // リンク解除済み
      })
      // レベルアップ
      event = state.event[2]
      expect(event.type).toBe("levelup")
      const levelup = event.data as LevelupDenco
      reika = {
        ...reika,
        link: [],
        currentExp: linksEXP
      }
      expect(levelup.before).toMatchObject(reika)
      expect(afterAccess).toMatchObject(reika)
      // レベルアップ後の状態
      let tmp = initUser(context, "someone", [reika])
      tmp = refreshState(context, tmp)
      reika = tmp.formation[0]
      // 最終状態
      const current = result.defense.formation[0]
      expect(current.level).toBe(reika.level)
      expect(current.currentExp).toBe(reika.currentExp)
      expect(levelup.before.level).toBe(10)
      expect(current).toMatchObject(levelup.after)
    }
  })
})