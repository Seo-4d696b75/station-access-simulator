import assert from "assert"
import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { Context, initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { getSkill, isSkillActive } from "../../core/skill"
import { initUser, refreshState, UserState } from "../../core/user"
import "../../gen/matcher"

describe("みなものスキル", () => {
  beforeAll(init)

  describe("スキル有効化", () => {

    test("有効化あり-攻撃側(アクセス)", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 2)
      let minamo = DencoManager.getDenco(context, "66", 50)
      let charlotte = DencoManager.getDenco(context, "6", 10, 1)
      let offense = initUser(context, "とあるマスター", [minamo, seria])
      let defense = initUser(context, "とあるマスター２", [charlotte])
      minamo = offense.formation[0]
      expect(getSkill(minamo).transition.state).toBe("unable")
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
      expect(hasSkillTriggered(result.offense, minamo)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
      expect(result.linkSuccess).toBe(true)
      let d = result.offense.formation[0]
      expect(isSkillActive(d.skill)).toBe(true)
    })
    test("有効化あり-攻撃側(アクセス)-フットバース", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 2)
      let minamo = DencoManager.getDenco(context, "66", 50)
      let charlotte = DencoManager.getDenco(context, "6", 10, 1)
      let offense = initUser(context, "とあるマスター", [minamo, seria])
      let defense = initUser(context, "とあるマスター２", [charlotte])
      minamo = offense.formation[0]
      expect(getSkill(minamo).transition.state).toBe("unable")
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
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minamo)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
      expect(result.linkSuccess).toBe(true)
      expect(result.pinkMode).toBe(true)
      let d = result.offense.formation[0]
      expect(isSkillActive(d.skill)).toBe(true)
    })
    test("有効化あり-攻撃側(編成内)", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let reika = DencoManager.getDenco(context, "5", 50)
      let minamo = DencoManager.getDenco(context, "66", 50)
      let charlotte = DencoManager.getDenco(context, "6", 10, 1)
      let offense = initUser(context, "とあるマスター", [minamo, seria, reika])
      let defense = initUser(context, "とあるマスター２", [charlotte])
      minamo = offense.formation[0]
      expect(getSkill(minamo).transition.state).toBe("unable")
      const config = {
        offense: {
          state: offense,
          carIndex: 2
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minamo)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
      expect(result.linkSuccess).toBe(true)
      let d = result.offense.formation[0]
      expect(isSkillActive(d.skill)).toBe(true)
    })
    test("有効化なし-攻撃側(アクセス)-リンク数足りない", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let minamo = DencoManager.getDenco(context, "66", 50)
      let charlotte = DencoManager.getDenco(context, "6", 10, 1)
      let offense = initUser(context, "とあるマスター", [minamo, seria])
      let defense = initUser(context, "とあるマスター２", [charlotte])
      minamo = offense.formation[0]
      expect(getSkill(minamo).transition.state).toBe("unable")
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
      expect(hasSkillTriggered(result.offense, minamo)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
      expect(result.linkSuccess).toBe(true)
      let d = result.offense.formation[0]
      expect(isSkillActive(d.skill)).toBe(false)
    })
    test("有効化なし-攻撃側(アクセス)-リンク失敗", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 2)
      let minamo = DencoManager.getDenco(context, "66", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      let offense = initUser(context, "とあるマスター", [minamo, seria])
      let defense = initUser(context, "とあるマスター２", [charlotte])
      minamo = offense.formation[0]
      expect(getSkill(minamo).transition.state).toBe("unable")
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
      expect(hasSkillTriggered(result.offense, minamo)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
      expect(result.linkSuccess).toBe(false)
      let d = result.offense.formation[0]
      expect(isSkillActive(d.skill)).toBe(false)
    })
    test("有効化なし-攻撃側(編成内)-リンク数足りない", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let minamo = DencoManager.getDenco(context, "66", 50)
      let charlotte = DencoManager.getDenco(context, "6", 10, 1)
      let offense = initUser(context, "とあるマスター", [minamo, seria])
      let defense = initUser(context, "とあるマスター２", [charlotte])
      minamo = offense.formation[0]
      expect(getSkill(minamo).transition.state).toBe("unable")
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minamo)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
      expect(result.linkSuccess).toBe(true)
      let d = result.offense.formation[0]
      expect(isSkillActive(d.skill)).toBe(false)
    })
    test("有効化なし-攻撃側(編成内)-リンク失敗", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 2)
      let minamo = DencoManager.getDenco(context, "66", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      let offense = initUser(context, "とあるマスター", [minamo, seria])
      let defense = initUser(context, "とあるマスター２", [charlotte])
      minamo = offense.formation[0]
      expect(getSkill(minamo).transition.state).toBe("unable")
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minamo)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
      expect(result.linkSuccess).toBe(false)
      let d = result.offense.formation[0]
      expect(isSkillActive(d.skill)).toBe(false)
    })

  })

  const activateMinamo = (context: Context, state: UserState, idx: number): UserState => {
    let charlotte = DencoManager.getDenco(context, "6", 1, 1)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    expect(getSkill(state.formation[idx]).transition.state).toBe("unable")
    const config = {
      offense: {
        state: state,
        carIndex: idx
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkSuccess).toBe(true)
    let d = result.offense.formation[idx]
    expect(isSkillActive(d.skill)).toBe(true)
    return result.offense
  }

  test("スキル状態遷移", () => {
    // 数少ない autoタイプ
    const context = initContext("test", "test", false)
    const start = context.currentTime
    context.clock = start

    let seria = DencoManager.getDenco(context, "1", 50, 2)
    let minamo = DencoManager.getDenco(context, "66", 50)
    let state = initUser(context, "とあるマスター", [minamo, seria])

    state = activateMinamo(context, state, 0)
    let d = state.formation[0]
    let skill = getSkill(d)
    expect(skill.transitionType).toBe("auto")
    expect(skill.transition.state).toBe("active")
    expect(skill.transition.data).not.toBeUndefined()
    expect(skill.transition.data).toMatchObject({
      activatedAt: start,
      activeTimeout: start + 1800 * 1000,
      cooldownTimeout: start + 1800 * 1000, // cooldown時間は0
    })
    // スキル発動の表示あり
    expect(state.event.length).toBe(2)
    expect(state.event[0].type).toBe("access")
    let e = state.event[1]
    assert(e.type === "skill_trigger")
    expect(e.data.time).toBe(start)
    expect(e.data.denco).toMatchDencoState(d)
    expect(e.data.skillName).toBe("みんなでショウ・タイム Lv.4")

    context.clock = start + 1800 * 1000
    state = refreshState(context, state)
    d = state.formation[0]
    skill = getSkill(d)
    expect(skill.transition.state).toBe("unable")
    expect(skill.transition.data).toBeUndefined()
  })

  describe("アクセス処理", () => {

    test("発動あり-攻撃側(アクセス)", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 2)
      let minamo = DencoManager.getDenco(context, "66", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [minamo, seria])
      offense = activateMinamo(context, offense, 0)
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
      expect(hasSkillTriggered(result.offense, minamo)).toBe(true)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(75)
      expect(result.damageBase?.constant).toBe(0)
      expect(result.damageBase?.variable).toBe(minamo.ap)
      let d = result.defense!.formation[0]
      expect(d.damage?.value).toBe(minamo.ap + 75)
    })
    test("発動なし-攻撃側(編成内)", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 2)
      let minamo = DencoManager.getDenco(context, "66", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [minamo, seria])
      offense = activateMinamo(context, offense, 0)
      let defense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minamo)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
    })
  })
})