import assert from "assert"
import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { skillInvalidateDenco } from "../tool/fake"
import { testAlwaysSkill } from "../tool/skillState"

describe("リトのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "77",
    name: "reto"
  })

  test("発動あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    const start = context.currentTime
    context.clock = start

    let reto = DencoManager.getDenco(context, "77", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 80)
    let defense = initUser(context, "とあるマスター", [reto])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: reto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)

    assert(result.defense)
    let d = result.defense.formation[0]
    // resultには最初のアクセス結果
    expect(d.reboot).toBe(true)
    expect(d.hpAfter).toBe(0)
    expect(result.defense.event.length).toBe(4)
    let e = result.defense.event[0]
    assert(e.type === "access")
    // イベントの順序は リブート > スキル発動（アクセスの発生）> スキル発動の記録
    e = result.defense.event[1]
    assert(e.type === "reboot")
    expect(e.data.time).toBe(start)
    expect(e.data.denco).toMatchDencoState({ ...d, link: [], currentExp: 0 }) // リンク解除
    e = result.defense.event[2]
    assert(e.type === "access")
    expect(e.data.time).toBe(start)
    expect(e.data.which).toBe("offense")
    e = result.defense.event[3]
    assert(e.type === "skill_trigger")
    expect(e.data.time).toBe(start)
    expect(e.data.carIndex).toBe(0)
    expect(e.data.step).toBe("self")
    expect(e.data.skillName).toBe("ワンダーエスケープ Lv.4")
    expect(e.data.denco).toMatchDencoState(d)
  })
  test("発動あり-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    const start = context.currentTime
    context.clock = start

    let reto = DencoManager.getDenco(context, "77", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 80)
    let defense = initUser(context, "とあるマスター", [reto, hiiru])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: reto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)

    assert(result.defense)
    let d0 = result.defense.formation[0]
    // resultには最初のアクセス結果
    expect(d0.reboot).toBe(true)
    expect(d0.hpAfter).toBe(0)
    let d1 = result.defense.formation[1]
    expect(result.defense.event.length).toBe(5)
    let e = result.defense.event[0]
    assert(e.type === "access")
    e = result.defense.event[1]
    assert(e.type === "reboot")
    expect(e.data.time).toBe(start)
    expect(e.data.denco).toMatchDencoState({ ...d0, link: [], currentExp: 0 }) // リンク解除
    // スキル発動確率の確認（ひいるスキル発動）> スキル発動（アクセスの発生）> スキル発動の記録
    e = result.defense.event[2]
    assert(e.type === "skill_trigger")
    expect(e.data.time).toBe(start)
    expect(e.data.carIndex).toBe(1)
    expect(e.data.step).toBe("probability_check")
    expect(e.data.skillName).toBe("テンションAGEAGE↑↑ Lv.4")
    expect(e.data.denco).toMatchDencoState(d1)
    e = result.defense.event[3]
    assert(e.type === "access")
    expect(e.data.time).toBe(start)
    expect(e.data.which).toBe("offense")
    e = result.defense.event[4]
    assert(e.type === "skill_trigger")
    expect(e.data.time).toBe(start)
    expect(e.data.carIndex).toBe(0)
    expect(e.data.step).toBe("self")
    expect(e.data.skillName).toBe("ワンダーエスケープ Lv.4")
    expect(e.data.denco).toMatchDencoState(d0)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    const start = context.currentTime
    context.clock = start

    let reto = DencoManager.getDenco(context, "77", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 80)
    let defense = initUser(context, "とあるマスター", [reto, hiiru])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: reto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)

    assert(result.defense)
    let d = result.defense.formation[0]
    expect(d.reboot).toBe(true)
    expect(d.hpAfter).toBe(0)
    expect(result.defense.event.length).toBe(2)
    let e = result.defense.event[0]
    assert(e.type === "access")
    e = result.defense.event[1]
    assert(e.type === "reboot")
    expect(e.data.time).toBe(start)
    expect(e.data.denco).toMatchDencoState({ ...d, currentExp: 0 }) // リンク解除
    // リト本人のスキルが発動しないので確率ブーストのひいるスキルも記録しない
  })

  describe("発動なし-カウンターでリブート", () => {
    test("シーナ", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      const start = context.currentTime
      context.clock = start

      let reto = DencoManager.getDenco(context, "77", 50, 1)
      let sheena = DencoManager.getDenco(context, "7", 80, 1)
      let offense = initUser(context, "とあるマスター", [reto])
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
      expect(result.linkDisconnected).toBe(false)
      expect(result.linkSuccess).toBe(false)

      let d = result.offense.formation[0]
      expect(d.reboot).toBe(true)
      expect(d.hpAfter).toBe(0)
      expect(result.offense.event.length).toBe(2)
      let e = result.offense.event[0]
      assert(e.type === "access")
      e = result.offense.event[1]
      assert(e.type === "reboot")
      expect(e.data.time).toBe(start)
      expect(e.data.denco).toMatchDencoState({ ...d, currentExp: 0 })
    })
    test("まりか", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      const start = context.currentTime
      context.clock = start

      let reto = DencoManager.getDenco(context, "77", 50, 1)
      let marika = DencoManager.getDenco(context, "58", 10, 1)
      let offense = initUser(context, "とあるマスター", [reto])
      let defense = initUser(context, "とあるマスター２", [marika])
      defense = activateSkill(context, defense, 0)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: marika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.linkDisconnected).toBe(true)
      expect(result.linkSuccess).toBe(false)

      let d = result.offense.formation[0]
      expect(d.reboot).toBe(true)
      expect(d.hpAfter).toBe(0)
      expect(result.offense.event.length).toBe(2)
      let e = result.offense.event[0]
      assert(e.type === "access")
      e = result.offense.event[1]
      assert(e.type === "reboot")
      expect(e.data.time).toBe(start)
      expect(e.data.denco).toMatchDencoState({ ...d, currentExp: 0 })
    })
  })

  test("発動なし-無効化", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    const start = context.currentTime
    context.clock = start

    let reto = DencoManager.getDenco(context, "77", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 80)
    let test = skillInvalidateDenco("77")
    let defense = initUser(context, "とあるマスター", [reto])
    let offense = initUser(context, "とあるマスター２", [reika, test])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: reto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(hasSkillTriggered(result.offense, test)).toBe(true)

    assert(result.defense)
    let d = result.defense.formation[0]
    expect(d.reboot).toBe(true)
    expect(d.hpAfter).toBe(0)
    expect(d.skillInvalidated).toBe(true)
    expect(result.defense.event.length).toBe(2)
    let e = result.defense.event[0]
    assert(e.type === "access")
    e = result.defense.event[1]
    assert(e.type === "reboot")
    expect(e.data.time).toBe(start)
    expect(e.data.denco).toMatchDencoState({ ...d, currentExp: 0 }) // リンク解除
  })
})