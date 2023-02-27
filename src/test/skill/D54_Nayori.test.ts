import assert from "assert"
import { Context, copy, getSkill, init, ReadonlyState } from "../.."
import { AccessUserResult, getDefense, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser, UserState } from "../../core/user"
import { refreshEXPState } from "../../core/user/refresh"
import "../../gen/matcher"
import { testAlwaysSkill } from "../tool/skillState"

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
    expect(hasSkillTriggered(result, "offense", nayori)).toBe(false)

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
    expect(hasSkillTriggered(result, "offense", nayori)).toBe(false)
    expect(result.linkSuccess).toBe(false)
    let events = result.offense.event
    expect(events.length).toBe(2)
    expect(events[0].type).toBe("access")
    expect(events[1].type).toBe("skill_trigger")
    let event = events[1]
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.skillName).toBe("お便りなの♪ Lv.4")
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDencoState(result.offense.formation[0])

    // 経験値配布
    let dNayori = result.offense.formation[0]
    let dSeria = result.offense.formation[1]
    let dCharlotte = getDefense(result).formation[0]
    // セリアに配布
    const exp = Math.floor(dNayori.exp.access.total * 0.08)
    expect(dSeria.exp.total).toBe(0)
    expect(dSeria.currentExp).toBe(exp)
    // 自身には配布しない
    expect(dNayori.exp.access.accessBonus).toBe(DEFAULT_EXP)
    expect(dNayori.exp.access.damageBonus).toBe(dCharlotte.damage!.value)
    expect(dNayori.exp.access.linkBonus).toBe(0)
    expect(dNayori.exp.access.total).toBe(DEFAULT_EXP + dCharlotte.damage!.value)
    expect(dNayori.exp.link).toBe(0)
    expect(dNayori.exp.skill).toBe(0)
    expect(dNayori.exp.total).toBe(dNayori.exp.access.total)
    expect(dNayori.currentExp).toBe(dNayori.exp.access.total)
  })

  test("発動あり-攻撃側(アクセス)-リンク成功", () => {
    const context = initContext("test", "test", false)
    context.clock = context.currentTime

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
    expect(hasSkillTriggered(result, "offense", nayori)).toBe(false)
    expect(result.linkSuccess).toBe(true)

    let event = result.offense.event[1]
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.skillName).toBe("お便りなの♪ Lv.4")
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.denco.carIndex).toBe(5)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDenco(result.offense.formation[5])

    // 経験値配布
    let dNayori = result.offense.formation[5]
    let dReika = result.offense.formation[4]
    let dCharlotte = getDefense(result).formation[0]
    // 自身には配布しない
    expect(dNayori.exp.access.accessBonus).toBe(DEFAULT_EXP) // アクセス開始
    expect(dNayori.exp.access.damageBonus).toBe(dCharlotte.damage!.value)
    expect(dNayori.exp.access.linkBonus).toBe(DEFAULT_EXP)
    expect(dNayori.exp.access.total).toBe(DEFAULT_EXP * 2 + dCharlotte.damage!.value)
    expect(dNayori.exp.link).toBe(0)
    expect(dNayori.exp.skill).toBe(0)
    expect(dNayori.exp.total).toBe(dNayori.exp.access.total)
    expect(dNayori.currentExp).toBe(dNayori.exp.access.total)
    // 配布対象
    const exp = Math.floor(dNayori.exp.access.total * 0.08)
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
    assert(result.defense)
    expect(hasSkillTriggered(result, "defense", nayori)).toBe(false)
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)

    let events = result.defense!.event
    expect(events.length).toBe(3)
    assert(events[0].type === "access")
    let event = events[1]
    assert(event.type === "reboot")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.denco).toMatchDenco(result.defense.formation[0])

    event = events[2]
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.skillName).toBe("お便りなの♪ Lv.4")
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDencoState(result.defense.formation[0])

    // 経験値配布
    let dNayori = result.defense!.formation[0]
    // 自身には配布しない
    expect(dNayori.exp.access.total).toBe(0)
    expect(dNayori.exp.link).toBe(dNayori.disconnectedLink!.exp)
    expect(dNayori.disconnectedLink!.link[0].duration).toBe(10000)
    expect(dNayori.exp.link).toBe(10000 * DEFAULT_LINK_EXP_UNIT)
    expect(dNayori.exp.skill).toBe(0)
    expect(dNayori.exp.total).toBe(dNayori.exp.link)
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
    expect(hasSkillTriggered(result, "defense", nayori)).toBe(false)
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
    expect(hasSkillTriggered(result, "defense", nayori)).toBe(false)
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
    expect(hasSkillTriggered(result, "defense", nayori)).toBe(false)
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
    assert(result.defense)
    expect(hasSkillTriggered(result, "defense", nayori)).toBe(false)
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)

    let events = result.defense!.event
    expect(events.length).toBe(4)
    expect(events[0].type).toBe("access")
    let event = events[1]
    assert(event.type === "reboot")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.denco).toMatchDenco(result.defense.formation[0])

    event = events[2]
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.skillName).toBe("お便りなの♪ Lv.4")
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDencoState(result.defense.formation[0])

    event = events[3]
    assert(event.type === "levelup")
    let d = event.data.after
    expect(d.name).toBe("seria")
    expect(d.level).toBe(51)
    expect(d.currentExp).toBe(7)

    // 経験値配布
    let dNayori = result.defense!.formation[0]
    // 自身には配布しない
    expect(dNayori.exp.access.total).toBe(0)
    expect(dNayori.exp.link).toBe(dNayori.disconnectedLink!.exp)
    expect(dNayori.disconnectedLink!.link[0].duration).toBe(10000)
    expect(dNayori.exp.link).toBe(100)
    expect(dNayori.exp.skill).toBe(0)
    expect(dNayori.exp.total).toBe(dNayori.exp.link)
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
    assert(result.defense)
    expect(hasSkillTriggered(result, "defense", nayori)).toBe(false)
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)

    let events = result.defense!.event
    expect(events.length).toBe(4)
    expect(events[0].type).toBe("access")

    let event = events[1]
    assert(event.type === "reboot")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.denco).toMatchDenco(result.defense.formation[0])

    // スキルレベルも上がっている
    event = events[2]
    assert(event.type === "levelup")
    let before = event.data.before
    let after = event.data.after
    expect(before.name).toBe("nayori")
    expect(before.level).toBe(59)
    expect(getSkill(before).level).toBe(4)
    expect(after.level).toBe(60)
    expect(getSkill(after).level).toBe(5)
    expect(after.currentExp).toBe(100 - 1)

    event = events[3]
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.skillName).toBe("お便りなの♪ Lv.5")
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDencoState(result.defense.formation[0])


    // 経験値配布
    let dNayori = result.defense!.formation[0]
    // 自身には配布しない
    expect(dNayori.exp.access.total).toBe(0)
    expect(dNayori.exp.link).toBe(dNayori.disconnectedLink!.exp)
    expect(dNayori.disconnectedLink!.link[0].duration).toBe(10000)
    expect(dNayori.exp.link).toBe(100)
    expect(dNayori.exp.skill).toBe(0)
    expect(dNayori.exp.total).toBe(dNayori.exp.link)
    expect(dNayori.currentExp).toBe(99)
    // FIXME 実際のゲームの動作では 「なよりのリブート」→「スキルレベル4→5」→「スキルレベル4発動」
    // 現在の実装ではスキルレベル5で発動してしまう
    // でもダイアログの表示順的にはこっちのほうが自然では？
    // issue: https://github.com/Seo-4d696b75/station-access-simulator/issues/17
    const exp = Math.floor(100 * 0.12)
    checkExp(context, defense, result.defense!, [1], exp)
  })
})

function checkExp(context: Context, before: ReadonlyState<UserState>, after: ReadonlyState<AccessUserResult>, indices: number[], exp: number) {
  // 経験値追加の確認
  indices.forEach(i => {
    const d = after.formation[i]
    expect(d.exp.total).toBe(0)
  })
  // 経験値を加算
  let state = copy.UserState(before)
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