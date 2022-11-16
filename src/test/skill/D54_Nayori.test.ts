import assert from "assert"
import { Context, copyState, getSkill, init, ReadonlyState } from "../.."
import { getDefense, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser, UserState } from "../../core/user"
import { refreshEXPState } from "../../core/user/refresh"
import { testAlwaysSkill } from "../skillState"

const DEFAULT_EXP = 100
const DEFAULT_LINK_EXP_UNIT = 1 / 100

describe("なよりのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "54",
    name: "nayori"
  })

  test("発動なし-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    context.clock = context.currentTime
    let seria = DencoManager.getDenco(context, "1", 50)
    let nayori = DencoManager.getDenco(context, "54", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 1)
    let offense = initUser(context, "とあるマスター", [seria, nayori])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, nayori)).toBe(false)

    let events = result.offense.event
    expect(events.length).toBe(1)
    expect(events[0].type).toBe("access")
  })

  test("発動あり-攻撃側(アクセス)-リンク失敗", () => {
    const context = initContext("test", "test", false)
    context.clock = context.currentTime
    let seria = DencoManager.getDenco(context, "1", 50)
    let nayori = DencoManager.getDenco(context, "54", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 1)
    let offense = initUser(context, "とあるマスター", [nayori, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, nayori)).toBe(false)
    expect(result.linkSuccess).toBe(false)
    let events = result.offense.event
    expect(events.length).toBe(2)
    expect(events[0].type).toBe("access")
    expect(events[1].type).toBe("skill_trigger")
    let event = events[1]
    assert(event.type === "skill_trigger")
    expect(event.data.denco.name).toBe("nayori")
    expect(event.data.step).toBe("self")
    expect(event.data.time).toBe(context.currentTime)

    // 経験値配布
    let dNayori = result.offense.formation[0]
    let dSeria = result.offense.formation[1]
    let dCharlotte = getDefense(result).formation[0]
    // セリアに配布
    const exp = Math.floor(dNayori.exp.access * 0.08)
    expect(dSeria.currentExp).toBe(exp)
    // 自身には配布しない
    expect(dNayori.exp.access).toBe(DEFAULT_EXP + dCharlotte.damage!.value)
    expect(dNayori.exp.link).toBe(0)
    expect(dNayori.exp.skill).toBe(0)
    expect(dNayori.currentExp).toBe(dNayori.exp.access)
  })

  test("発動あり-攻撃側(アクセス)-リンク成功", () => {
    const context = initContext("test", "test", false)

    let seria = DencoManager.getDenco(context, "1", 50)
    let mero = DencoManager.getDenco(context, "2", 50)
    let luna = DencoManager.getDenco(context, "3", 50)
    let miroku = DencoManager.getDenco(context, "4", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let nayori = DencoManager.getDenco(context, "54", 50)
    let charlotte = DencoManager.getDenco(context, "6", 10, 1)
    let offense = initUser(context, "とあるマスター", [seria, mero, luna, miroku, reika, nayori])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 5
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, nayori)).toBe(false)
    expect(result.linkSuccess).toBe(true)

    let event = result.offense.event[1]
    assert(event.type === "skill_trigger")
    expect(event.data.denco.name).toBe("nayori")

    // 経験値配布
    let dNayori = result.offense.formation[5]
    let dReika = result.offense.formation[4]
    let dCharlotte = getDefense(result).formation[0]
    // 自身には配布しない
    expect(dNayori.exp.access).toBe(DEFAULT_EXP * 2 + dCharlotte.damage!.value) // 開始・ダメージ・成功
    expect(dNayori.exp.link).toBe(0)
    expect(dNayori.exp.skill).toBe(0)
    expect(dNayori.currentExp).toBe(dNayori.exp.access)
    // 配布対象
    const exp = Math.floor(dNayori.exp.access * 0.08)
    checkExp(context, offense, result.offense, [0, 1, 2, 3], exp)
    // 配布対象外
    expect(dReika.currentExp).toBe(0)
  })

  test("発動あり-守備側(アクセス)-リブート", () => {
    const context = initContext("test", "test", false)
    const now = context.currentTime
    context.clock = now
    let seria = DencoManager.getDenco(context, "1", 50)
    let mero = DencoManager.getDenco(context, "2", 50)
    let luna = DencoManager.getDenco(context, "3", 50)
    let reika = DencoManager.getDenco(context, "5", 80)
    let nayori = DencoManager.getDenco(context, "54", 50, 1)
    // リンク時間を 10000msに設定
    nayori.link[0].start = now - 10000
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [nayori, seria, mero, luna])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: nayori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, nayori)).toBe(false)
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)

    let events = result.defense!.event
    expect(events.length).toBe(3)
    assert(events[0].type === "access")
    assert(events[1].type === "reboot")
    expect(events[1].data.denco.name).toBe("nayori")
    assert(events[2].type === "skill_trigger")
    expect(events[2].data.denco.name).toBe("nayori")

    // 経験値配布
    let dNayori = result.defense!.formation[0]
    // 自身には配布しない
    expect(dNayori.exp.access).toBe(0)
    expect(dNayori.exp.link).toBe(dNayori.disconnectedLink!.exp)
    expect(dNayori.disconnectedLink!.link[0].duration).toBe(10000)
    expect(dNayori.exp.link).toBe(10000 * DEFAULT_LINK_EXP_UNIT)
    expect(dNayori.exp.skill).toBe(0)
    expect(dNayori.currentExp).toBe(dNayori.exp.link)
    // 配布
    const exp = Math.floor(dNayori.exp.link * 0.08)
    checkExp(context, defense, result.defense!, [1, 2, 3], exp)
  })
  test("発動なし-守備側(アクセス)-配布経験値なし", () => {
    const context = initContext("test", "test", false)
    const now = context.currentTime
    context.clock = now
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 10)
    let nayori = DencoManager.getDenco(context, "54", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [nayori, seria])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: nayori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, nayori)).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.linkDisconnected).toBe(false)

    let events = result.defense!.event
    expect(events.length).toBe(1)
    assert(events[0].type === "access")
  })
  test("発動なし-守備側(アクセス)-配布対象でんこ不在（単独）", () => {
    const context = initContext("test", "test", false)
    const now = context.currentTime
    context.clock = now
    let reika = DencoManager.getDenco(context, "5", 80)
    let nayori = DencoManager.getDenco(context, "54", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [nayori])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: nayori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, nayori)).toBe(false)
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)

    let events = result.defense!.event
    expect(events.length).toBe(2)
    expect(events[0].type).toBe("access")
    expect(events[1].type).toBe("reboot")
  })
  test("発動なし-守備側(アクセス)-配布対象でんこ不在（レベル上限）", () => {
    const context = initContext("test", "test", false)
    const now = context.currentTime
    context.clock = now
    let seria = DencoManager.getDenco(context, "1", 80)
    let reika = DencoManager.getDenco(context, "5", 80)
    let nayori = DencoManager.getDenco(context, "54", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [nayori, seria])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: nayori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, nayori)).toBe(false)
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)

    let events = result.defense!.event
    expect(events.length).toBe(2)
    expect(events[0].type).toBe("access")
    expect(events[1].type).toBe("reboot")
  })
  test("発動あり-守備側(アクセス)-リブート-レベルアップ", () => {
    const context = initContext("test", "test", false)
    const now = context.currentTime
    context.clock = now
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 80)
    let nayori = DencoManager.getDenco(context, "54", 50, 1)
    // リンク時間を 10000msに設定
    expect(seria.nextExp).toBe(37600)
    seria.currentExp = seria.nextExp - 1
    nayori.link[0].start = now - 10000
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [nayori, seria])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: nayori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, nayori)).toBe(false)
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)

    let events = result.defense!.event
    expect(events.length).toBe(4)
    expect(events[0].type).toBe("access")
    assert(events[1].type === "reboot")
    expect(events[1].data.denco.name).toBe("nayori")
    assert(events[2].type === "skill_trigger")
    expect(events[2].data.denco.name).toBe("nayori")
    assert(events[3].type === "levelup")
    let d = events[3].data.after
    expect(d.name).toBe("seria")
    expect(d.level).toBe(51)
    expect(d.currentExp).toBe(7)

    // 経験値配布
    let dNayori = result.defense!.formation[0]
    // 自身には配布しない
    expect(dNayori.exp.access).toBe(0)
    expect(dNayori.exp.link).toBe(dNayori.disconnectedLink!.exp)
    expect(dNayori.disconnectedLink!.link[0].duration).toBe(10000)
    expect(dNayori.exp.link).toBe(100)
    expect(dNayori.exp.skill).toBe(0)
    expect(dNayori.currentExp).toBe(dNayori.exp.link)
    // 配布
    const exp = Math.floor(100 * 0.08)
    checkExp(context, defense, result.defense!, [1], exp)
  })
  test("発動あり-守備側(アクセス)-リブート-スキルレベルアップ", () => {
    const context = initContext("test", "test", false)
    const now = context.currentTime
    context.clock = now
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 80)
    let nayori = DencoManager.getDenco(context, "54", 59, 1)
    // リンク時間を 10000msに設定
    nayori.currentExp = nayori.nextExp - 1
    nayori.link[0].start = now - 10000
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [nayori, seria])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: nayori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, nayori)).toBe(false)
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)

    let events = result.defense!.event
    expect(events.length).toBe(4)
    expect(events[0].type).toBe("access")
    assert(events[1].type === "reboot")
    expect(events[1].data.denco.name).toBe("nayori")
    // スキルレベルも上がっている
    assert(events[2].type === "levelup")
    let before = events[2].data.before
    let after = events[2].data.after
    expect(before.name).toBe("nayori")
    expect(before.level).toBe(59)
    expect(getSkill(before).level).toBe(4)
    expect(after.level).toBe(60)
    expect(getSkill(after).level).toBe(5)
    expect(after.currentExp).toBe(100 - 1)
    assert(events[3].type === "skill_trigger")
    expect(events[3].data.denco.name).toBe("nayori")

    // 経験値配布
    let dNayori = result.defense!.formation[0]
    // 自身には配布しない
    expect(dNayori.exp.access).toBe(0)
    expect(dNayori.exp.link).toBe(dNayori.disconnectedLink!.exp)
    expect(dNayori.disconnectedLink!.link[0].duration).toBe(10000)
    expect(dNayori.exp.link).toBe(100)
    expect(dNayori.exp.skill).toBe(0)
    expect(dNayori.currentExp).toBe(99)
    // FIXME
    // 実際のゲームの動作では 「なよりのリブート」→「スキルレベル3→4」→「スキルレベル3発動」
    // 現在の実装ではスキルレベル４で発動してしまう
    // でもダイアログの表示順的にはこっちのほうが自然では？
    const exp = Math.floor(100 * 0.12)
    checkExp(context, defense, result.defense!, [1], exp)
  })
})

function checkExp(context: Context, before: ReadonlyState<UserState>, after: ReadonlyState<UserState>, indices: number[], exp: number) {
  // 経験値を加算
  let state = copyState<UserState>(before)
  indices.forEach(i => state.formation[i].currentExp += exp)
  // レベルアップ考慮
  refreshEXPState(context, state)
  indices.forEach(i => {
    let a = state.formation[i]
    let b = after.formation[i]
    expect(b.numbering).toBe(a.numbering)
    expect(b.currentExp).toBe(a.currentExp)
    expect(b.level).toBe(a.level)
  })
}