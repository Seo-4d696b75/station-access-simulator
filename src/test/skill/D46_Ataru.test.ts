import assert from "assert"
import { times } from "lodash"
import { activateSkill, getSkill, init } from "../.."
import { AccessResult, getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"
import { Context, initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser, UserState } from "../../core/user"
import { testManualSkill } from "../skillState"

describe("あたるのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "46",
    name: "ataru",
    active: 10800,
    cooldown: 3600,
  })

  test("発動あり-攻撃側(アクセス)-０回", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
    expect(hasSkillTriggered(result.offense, ataru)).toBe(true)
    expect(result.attackPercent).toBe(0)
  })
  test("発動あり-攻撃側(アクセス)-１回", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // 被アクセス
    offense = repeatAccess(context, offense, 1)

    // カウントを確認
    let s = getSkill(offense.formation[0])
    expect(s.data.readNumber("damage_count_key", 0)).toBe(1)

    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
    expect(hasSkillTriggered(result.offense, ataru)).toBe(true)
    expect(result.attackPercent).toBe(3)
  })
  test("発動あり-攻撃側(アクセス)-10回", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // 被アクセス
    offense = repeatAccess(context, offense, 10)

    // カウントを確認
    let s = getSkill(offense.formation[0])
    expect(s.data.readNumber("damage_count_key", 0)).toBe(10)

    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
    expect(hasSkillTriggered(result.offense, ataru)).toBe(true)
    expect(result.attackPercent).toBe(30)
  })
  test("発動あり-攻撃側(アクセス)-20回", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // 被アクセス
    offense = repeatAccess(context, offense, 20)

    // カウントを確認
    let s = getSkill(offense.formation[0])
    expect(s.data.readNumber("damage_count_key", 0)).toBe(20)

    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
    expect(hasSkillTriggered(result.offense, ataru)).toBe(true)
    expect(result.attackPercent).toBe(60)
  })
  test("発動あり-攻撃側(アクセス)-30回", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // 被アクセス
    offense = repeatAccess(context, offense, 30)

    // カウントを確認
    let s = getSkill(offense.formation[0])
    expect(s.data.readNumber("damage_count_key", 0)).toBe(20)

    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
    expect(hasSkillTriggered(result.offense, ataru)).toBe(true)
    expect(result.attackPercent).toBe(60)
  })
  test("スキル状態-攻撃側(アクセス)-10回-リブート", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // 被アクセス
    offense = repeatAccess(context, offense, 10)
    let r = receiveAccess(context, offense, true)
    assert(r.defense)
    expect(r.defense.formation[0].reboot).toBe(true)
    offense = r.defense

    // カウントを確認 10 - 2
    let s = getSkill(offense.formation[0])
    expect(s.data.readNumber("damage_count_key", 0)).toBe(8)
  })
  test("スキル状態-攻撃側(アクセス)-30回-リブート", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // 被アクセス
    offense = repeatAccess(context, offense, 30)
    let r = receiveAccess(context, offense, true)
    assert(r.defense)
    expect(r.defense.formation[0].reboot).toBe(true)
    offense = r.defense

    // カウントを確認 20 - 2
    let s = getSkill(offense.formation[0])
    expect(s.data.readNumber("damage_count_key", 0)).toBe(18)
  })
  test("スキル状態-攻撃側(アクセス)-1回-リブート", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // 被アクセス
    offense = repeatAccess(context, offense, 1)
    let r = receiveAccess(context, offense, true)
    assert(r.defense)
    expect(r.defense.formation[0].reboot).toBe(true)
    offense = r.defense

    // カウントを確認
    let s = getSkill(offense.formation[0])
    expect(s.data.readNumber("damage_count_key", 0)).toBe(0)
  })
  test("スキル状態-攻撃側(アクセス)-シーナのカウンター-Rebootなし", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // アクセス  
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    sheena.ap = 10
    let defense = initUser(context, "user", [sheena])
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
    let d = getAccessDenco(result, "offense")
    expect(d.reboot).toBe(false)
    expect(d.hpAfter).toBeLessThan(d.hpBefore)
    expect(hasSkillTriggered(result.defense, sheena)).toBe(true)

    // カウントを確認 +1
    let s = getSkill(d)
    expect(s.data.readNumber("damage_count_key", 0)).toBe(1)
  })
  test("スキル状態-攻撃側(アクセス)-シーナのカウンター-Rebootあり1", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // アクセス  
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    sheena.ap = 1000
    let defense = initUser(context, "user", [sheena])
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
    let d = getAccessDenco(result, "offense")
    expect(d.reboot).toBe(true)
    expect(hasSkillTriggered(result.defense, sheena)).toBe(true)

    // カウントを確認
    let s = getSkill(d)
    expect(s.data.readNumber("damage_count_key", 0)).toBe(0)
  })
  test("スキル状態-攻撃側(アクセス)-シーナのカウンター-Rebootあり2", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // 被アクセス
    offense = repeatAccess(context, offense, 10)

    // アクセス  
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    sheena.maxHp = 1000
    sheena.currentHp = 1000
    sheena.ap = 1000
    let defense = initUser(context, "user", [sheena])
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
    let d = getAccessDenco(result, "offense")
    expect(d.reboot).toBe(true)
    expect(hasSkillTriggered(result.defense, sheena)).toBe(true)

    // カウントを確認 10 - 2
    let s = getSkill(d)
    expect(s.data.readNumber("damage_count_key", 0)).toBe(8)
  })
  // TODO まりかのカウンター
})

function repeatAccess(context: Context, state: UserState, count: number): UserState {
  let next = state
  times(count, () => {
    next = receiveAccess(context, next, false).defense!!
    // HPを回復
    let d = next.formation[0]
    d.currentHp = d.maxHp
  })
  return next
}

function receiveAccess(context: Context, state: UserState, reboot: boolean = false): AccessResult {
  let reika = DencoManager.getDenco(context, "5", 50, 1)
  if (reboot) {
    reika.ap = 500
  } else {
    reika.ap = 10
  }
  let offense = initUser(context, "user", [reika])
  const config = {
    offense: {
      state: offense,
      carIndex: 0
    },
    defense: {
      state: state,
      carIndex: 0
    },
    station: state.formation[0].link[0],
  }
  return startAccess(context, config)
}