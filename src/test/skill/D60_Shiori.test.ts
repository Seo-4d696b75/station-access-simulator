import assert from "assert"
import { activateSkill, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { testAlwaysSkill } from "../tool/skillState"

describe("しおりのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "60",
    name: "shiori"
  })

  test.each([1, 2, 3, 10])("発動あり-守備側(編成内)-リンクx%d", (linkCnt) => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    const now = context.currentTime
    context.clock = now

    let seria = DencoManager.getDenco(context, "1", 50, linkCnt)
    // レベルアップを無視させる
    seria.nextExp = Number.MAX_SAFE_INTEGER
    let shiori = DencoManager.getDenco(context, "60", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [seria, shiori])
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    // アクセス結果
    expect(result.defense).not.toBeUndefined()
    expect(result.linkDisconnected).toBe(true)
    expect(hasSkillTriggered(result, "defense", shiori)).toBe(false)
    assert(result.defense)
    let dSeria = result.defense.formation[0]
    let dShiori = result.defense.formation[1]
    // スキル発動
    expect(result.defense.event.length).toBe(3)
    let e = result.defense.event[0]
    expect(e.type).toBe("access")
    e = result.defense.event[1]
    assert(e.type === "reboot")
    expect(e.data.denco).toMatchDencoState(
      { ...dSeria, currentExp: 0 }
    )
    expect(e.data.link.length).toBe(linkCnt)
    expect(e.data.time).toBe(now)
    const linkExp = e.data.exp
    e = result.defense.event[2]
    assert(e.type === "skill_trigger")
    expect(e.data.denco).toMatchDencoState(dShiori)
    expect(e.data.denco.carIndex).toBe(1)
    expect(e.data.denco.who).toBe("self")
    expect(e.data.probability).toBe(35)
    expect(e.data.boostedProbability).toBe(35)
    expect(e.data.time).toBe(now)
    expect(e.data.skillName).toBe("たぶん完璧なアドバイス！ Lv.4")
    // 経験値追加
    expect(dSeria.name).toBe("seria")
    expect(dSeria.exp.access.total).toBe(0)
    expect(dSeria.exp.skill).toBe(0) // アクセス中の発動ではない！
    expect(dSeria.exp.link).toBe(linkExp)
    expect(dSeria.currentExp).toBe(linkExp + 350 * linkCnt)
  })


  test("発動あり-守備側(編成内)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"

    let seria = DencoManager.getDenco(context, "1", 50, 1)
    // レベルアップを無視させる
    seria.nextExp = Number.MAX_SAFE_INTEGER
    let shiori = DencoManager.getDenco(context, "60", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [seria, shiori, hiiru])
    defense = activateSkill(context, defense, 2)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    // アクセス結果
    expect(result.defense).not.toBeUndefined()
    expect(result.linkDisconnected).toBe(true)
    expect(hasSkillTriggered(result, "defense", shiori)).toBe(false)
    expect(hasSkillTriggered(result, "defense", hiiru)).toBe(false)
    assert(result.defense)
    // スキル発動
    expect(result.defense.event.length).toBe(4)
    let e = result.defense.event[0]
    expect(e.type).toBe("access")
    e = result.defense.event[1]
    assert(e.type === "reboot")
    expect(e.data.link.length).toBe(1)
    e = result.defense.event[2]
    assert(e.type === "skill_trigger")
    expect(e.data.denco).toMatchDencoState(result.defense.formation[2])
    expect(e.data.denco.carIndex).toBe(2)
    expect(e.data.denco.who).toBe("other")
    expect(e.data.probability).toBe(100)
    expect(e.data.boostedProbability).toBe(100)
    expect(e.data.skillName).toBe("テンションAGEAGE↑↑ Lv.4")
    e = result.defense.event[3]
    assert(e.type === "skill_trigger")
    expect(e.data.denco).toMatchDencoState(result.defense.formation[1])
    expect(e.data.denco.carIndex).toBe(1)
    expect(e.data.denco.who).toBe("self")
    expect(e.data.probability).toBe(35)
    expect(e.data.boostedProbability).toBe(35 * 1.2)
    expect(e.data.skillName).toBe("たぶん完璧なアドバイス！ Lv.4")
    // 経験値追加
    let d = result.defense.formation[0]
    expect(d.currentExp).toBe(d.exp.link + 350)
  })

  test("発動なし-守備側(編成内)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"

    let seria = DencoManager.getDenco(context, "1", 50, 1)
    // レベルアップを無視させる
    seria.nextExp = Number.MAX_SAFE_INTEGER
    let shiori = DencoManager.getDenco(context, "60", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [seria, shiori, hiiru])
    defense = activateSkill(context, defense, 2)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    // アクセス結果
    expect(result.defense).not.toBeUndefined()
    expect(result.linkDisconnected).toBe(true)
    expect(hasSkillTriggered(result, "defense", shiori)).toBe(false)
    expect(hasSkillTriggered(result, "defense", hiiru)).toBe(false)
    assert(result.defense)
    // スキル発動なし
    expect(result.defense.event.length).toBe(2)
    let e = result.defense.event[0]
    expect(e.type).toBe("access")
    e = result.defense.event[1]
    assert(e.type === "reboot")
    // 経験値追加
    let d = result.defense.formation[0]
    expect(d.currentExp).toBe(d.exp.link + 0)
  })


  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"

    let seria = DencoManager.getDenco(context, "1", 50)
    let shiori = DencoManager.getDenco(context, "60", 50, 1)
    // レベルアップを無視させる
    shiori.nextExp = Number.MAX_SAFE_INTEGER
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [shiori, seria])
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: shiori.link[0],
    }
    const result = startAccess(context, config)
    // アクセス結果
    expect(result.defense).not.toBeUndefined()
    expect(result.linkDisconnected).toBe(true)
    expect(hasSkillTriggered(result, "defense", shiori)).toBe(false)
    assert(result.defense)
    // スキル発動なし
    expect(result.defense.event.length).toBe(2)
    let e = result.defense.event[0]
    expect(e.type).toBe("access")
    e = result.defense.event[1]
    assert(e.type === "reboot")
    expect(e.data.link.length).toBe(1)
    // 経験値追加
    let d = result.defense.formation[0]
    expect(d.currentExp).toBe(d.exp.link + 0)
  })


  test("発動あり-守備側(編成内)-フットバース", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"

    let seria = DencoManager.getDenco(context, "1", 50, 10)
    // レベルアップを無視させる
    seria.nextExp = Number.MAX_SAFE_INTEGER
    let shiori = DencoManager.getDenco(context, "60", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [seria, shiori])
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: seria.link[0],
      usePink: true,
    }
    const result = startAccess(context, config)
    // アクセス結果
    expect(result.defense).not.toBeUndefined()
    expect(result.linkDisconnected).toBe(true)
    expect(hasSkillTriggered(result, "defense", shiori)).toBe(false)
    assert(result.defense)
    // スキル発動
    expect(result.defense.event.length).toBe(2)
    let e = result.defense.event[0]
    expect(e.type).toBe("access")
    e = result.defense.event[1]
    // リブートなし！！
    // assert(e.type === "reboot") 
    assert(e.type === "skill_trigger")
    expect(e.data.denco).toMatchDencoState(result.defense.formation[1])
    expect(e.data.denco.carIndex).toBe(1)
    expect(e.data.denco.who).toBe("self")
    expect(e.data.probability).toBe(35)
    expect(e.data.boostedProbability).toBe(35)
    expect(e.data.skillName).toBe("たぶん完璧なアドバイス！ Lv.4")
    // 経験値追加
    let d = result.defense.formation[0]
    expect(d.reboot).toBe(false)
    expect(d.exp.link).toBeGreaterThan(0) // 吹っ飛ばされた単独リンクの経験値
    expect(d.currentExp).toBe(d.exp.link + 350)
  })

  test("発動あり-攻撃側(編成内)-カウンターあり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"

    let seria = DencoManager.getDenco(context, "1", 50, 3)
    // レベルアップを無視させる
    seria.nextExp = Number.MAX_SAFE_INTEGER
    let shiori = DencoManager.getDenco(context, "60", 50)
    let sheena = DencoManager.getDenco(context, "7", 80, 1)
    let offense = initUser(context, "とあるマスター", [seria, shiori])
    let defense = initUser(context, "とあるマスター２", [sheena])
    const config = {
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
    // アクセス結果
    expect(result.defense).not.toBeUndefined()
    expect(result.linkDisconnected).toBe(false)
    expect(hasSkillTriggered(result, "offense", shiori)).toBe(false)
    // スキル発動
    expect(result.offense.event.length).toBe(3)
    let e = result.offense.event[0]
    expect(e.type).toBe("access")
    e = result.offense.event[1]
    assert(e.type === "reboot")
    expect(e.data.link.length).toBe(3)
    e = result.offense.event[2]
    assert(e.type === "skill_trigger")
    expect(e.data.denco).toMatchDencoState(result.offense.formation[1])
    expect(e.data.denco.carIndex).toBe(1)
    expect(e.data.denco.who).toBe("self")
    expect(e.data.probability).toBe(35)
    expect(e.data.boostedProbability).toBe(35)
    expect(e.data.skillName).toBe("たぶん完璧なアドバイス！ Lv.4")
    // 経験値追加
    let d = result.offense.formation[0]
    expect(d.reboot).toBe(true)
    expect(d.exp.link).toBeGreaterThan(0)
    expect(d.exp.access.total).toBe(100 + result.damageBase!.variable) // アクセス開始＋ダメージ量
    expect(d.exp.skill).toBe(0)
    expect(d.currentExp).toBe(d.exp.access.total + d.exp.link + 350 * 3)
  })


  test("発動あり-守備側(編成内)-レベルアップ", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    const now = context.currentTime
    context.clock = now

    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let shiori = DencoManager.getDenco(context, "60", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [seria, shiori])
    let offense = initUser(context, "とあるマスター２", [charlotte])
    seria = defense.formation[0]
    // リンクの経験値を調整
    // しおりのスキルの経験値追加でちょうどレベルアップする状態を作る
    seria.link[0].start = now - (seria.nextExp - 10) * 100
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    // アクセス結果
    expect(result.defense).not.toBeUndefined()
    expect(result.linkDisconnected).toBe(true)
    expect(hasSkillTriggered(result, "defense", shiori)).toBe(false)
    assert(result.defense)
    // レベルアップ
    let d = result.defense.formation[0]
    expect(d.level).toBe(51)
    expect(d.currentExp).toBe(-10 + 350)
    // スキル発動＆レベルアップイベント
    expect(result.defense.event.length).toBe(4)
    let e = result.defense.event[0]
    expect(e.type).toBe("access")
    e = result.defense.event[1]
    assert(e.type === "reboot")
    expect(e.data.link.length).toBe(1)
    e = result.defense.event[2]
    assert(e.type === "skill_trigger")
    expect(e.data.denco).toMatchDencoState(result.defense.formation[1])
    expect(e.data.denco.carIndex).toBe(1)
    expect(e.data.denco.who).toBe("self")
    expect(e.data.probability).toBe(35)
    expect(e.data.boostedProbability).toBe(35)
    expect(e.data.skillName).toBe("たぶん完璧なアドバイス！ Lv.4")
    e = result.defense.event[3]
    assert(e.type === "levelup")
    expect(e.data.time).toBe(now)
    expect(e.data.before).toMatchDencoState(
      { ...seria, link: [], currentExp: seria.nextExp - 10 + 350 } // レベルアップ直前の経験値
    )
    expect(e.data.after).toMatchDencoState(d)
  })

})