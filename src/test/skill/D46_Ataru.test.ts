import { times } from "lodash"
import { activateSkill, getSkill, init } from "../.."
import { AccessResult, getAccessDenco, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { assert, Context, initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser, UserState } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("あたるのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "46",
    name: "ataru",
    active: 10800,
    cooldown: 3600,
  })

  test.each([0, 1, 5, 10, 20, 30])("発動あり-攻撃側(アクセス)-%d回被ダメージ", (count) => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let ataru = DencoManager.getDenco(context, "46", 50, 1)
    let offense = initUser(context, "とあるマスター", [ataru, seria])
    offense = activateSkill(context, offense, 0)

    // 被アクセス
    offense = repeatAccess(context, offense, count)

    // カウントを確認
    let s = getSkill(offense.formation[0])
    expect(s.data.readNumber("damage_count_key", 0)).toBe(Math.min(count, 20))

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
    expect(hasSkillTriggered(result, "offense", ataru)).toBe(true)
    expect(result.attackPercent).toBe(3 * Math.min(count, 20))
  })

  describe("スキル状態-被アクセスカウントの増減", () => {

    test.each([1, 10, 20, 30])("%d回被アクアセスからのリブート", (count) => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let ataru = DencoManager.getDenco(context, "46", 50, 1)
      let offense = initUser(context, "とあるマスター", [ataru, seria])
      offense = activateSkill(context, offense, 0)

      // 被アクセス
      offense = repeatAccess(context, offense, count)
      let r = receiveAccess(context, offense, true)
      assert(r.defense)
      expect(r.defense.formation[0].reboot).toBe(true)
      offense = r.defense

      // カウントを確認 -2
      let s = getSkill(offense.formation[0])
      let current = Math.min(count, 20)
      let next = Math.max(current - 2, 0)
      expect(s.data.readNumber("damage_count_key", 0)).toBe(next)
    })
    describe("被カウンター（リブートなし）で増加", () => {

      test("シーナ", () => {
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
        expect(hasSkillTriggered(result, "defense", sheena)).toBe(true)

        // カウントを確認 +1
        let s = getSkill(d)
        expect(s.data.readNumber("damage_count_key", 0)).toBe(1)
      })
      test("くに", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        let seria = DencoManager.getDenco(context, "1", 50)
        let ataru = DencoManager.getDenco(context, "46", 50, 1)
        let offense = initUser(context, "とあるマスター", [ataru, seria])
        offense = activateSkill(context, offense, 0)

        // アクセス  
        let mikoto = DencoManager.getDenco(context, "37", 50, 1)
        let kuni = DencoManager.getDenco(context, "38", 50)
        kuni.ap = 10
        let defense = initUser(context, "user", [mikoto, kuni])
        defense = activateSkill(context, defense, 1)
        const config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0
          },
          station: mikoto.link[0],
        }
        const result = startAccess(context, config)
        let d = getAccessDenco(result, "offense")
        expect(d.reboot).toBe(false)
        expect(d.hpAfter).toBeLessThan(d.hpBefore)
        expect(hasSkillTriggered(result, "defense", kuni)).toBe(true)

        // カウントを確認 +1
        let s = getSkill(d)
        expect(s.data.readNumber("damage_count_key", 0)).toBe(1)
      })
      test("まりか", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        let seria = DencoManager.getDenco(context, "1", 50)
        let ataru = DencoManager.getDenco(context, "46", 50, 1)
        ataru.ap = 100
        let offense = initUser(context, "とあるマスター", [ataru, seria])
        offense = activateSkill(context, offense, 0)

        // アクセス  
        let marika = DencoManager.getDenco(context, "58", 50, 1)
        marika.currentHp = 10
        let defense = initUser(context, "user", [marika])
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
        let d = getAccessDenco(result, "offense")
        expect(d.reboot).toBe(false)
        expect(d.hpAfter).toBeLessThan(d.hpBefore)
        expect(hasSkillTriggered(result, "defense", marika)).toBe(true)

        // カウントを確認 +1
        let s = getSkill(d)
        expect(s.data.readNumber("damage_count_key", 0)).toBe(1)
      })
    })

    describe("被カウンター（リブートあり）で減少", () => {

      test("シーナ", () => {
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
        expect(hasSkillTriggered(result, "defense", sheena)).toBe(true)

        // カウントを確認 10 - 2
        let s = getSkill(d)
        expect(s.data.readNumber("damage_count_key", 0)).toBe(8)
      })
      test("まりか", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        let seria = DencoManager.getDenco(context, "1", 50)
        let ataru = DencoManager.getDenco(context, "46", 50, 1)
        ataru.ap = 1000
        let offense = initUser(context, "とあるマスター", [ataru, seria])
        offense = activateSkill(context, offense, 0)

        // 被アクセス
        offense = repeatAccess(context, offense, 10)

        // アクセス  
        let marika = DencoManager.getDenco(context, "58", 50, 1)
        marika.currentHp = 10
        let defense = initUser(context, "user", [marika])
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
        let d = getAccessDenco(result, "offense")
        expect(d.reboot).toBe(true)
        expect(hasSkillTriggered(result, "defense", marika)).toBe(true)

        // カウントを確認 10 - 2
        let s = getSkill(d)
        expect(s.data.readNumber("damage_count_key", 0)).toBe(8)
      })
    })
    describe("ダメージ0の場合は増減なし", () => {

      test("足湯", () => {

        const context = initContext("test", "test", false)
        context.random.mode = "force"
        let seria = DencoManager.getDenco(context, "1", 50)
        let ataru = DencoManager.getDenco(context, "46", 50, 1)
        let defense = initUser(context, "とあるマスター", [ataru, seria])
        defense = activateSkill(context, defense, 0)

        // 被アクセス
        defense = repeatAccess(context, defense, 10)

        // アクセス  
        let sheena = DencoManager.getDenco(context, "7", 50, 1)
        let offense = initUser(context, "user", [sheena])
        const config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0
          },
          station: ataru.link[0],
          usePink: true,
        }
        const result = startAccess(context, config)

        // カウントを確認 10 - 0
        assert(result.defense)
        let d = getAccessDenco(result, "defense")
        expect(d.damage).toBeUndefined()
        let s = getSkill(d)
        expect(s.data.readNumber("damage_count_key", 0)).toBe(10)
      })
      test("スキルでダメージ0", () => {

        const context = initContext("test", "test", false)
        context.random.mode = "force"
        let mio = DencoManager.getDenco(context, "36", 80)
        let ataru = DencoManager.getDenco(context, "46", 50, 1)
        let maze = DencoManager.getDenco(context, "67", 50)
        let defense = initUser(context, "とあるマスター", [ataru, mio, maze])
        defense = activateSkill(context, defense, 0)

        // 被アクセス
        defense = repeatAccess(context, defense, 10)
        defense = activateSkill(context, defense, 1)
        defense.user.daily = {
          accessStationCount: 26
        }
        
        // アクセス  
        let sheena = DencoManager.getDenco(context, "7", 10, 1)
        let offense = initUser(context, "user", [sheena])
        const config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0
          },
          station: ataru.link[0],
        }
        const result = startAccess(context, config)

        // カウントを確認 10 - 0
        assert(result.defense)
        let d = getAccessDenco(result, "defense")
        expect(d.damage).not.toBeUndefined()
        expect(d.damage?.value).toBe(0)
        let s = getSkill(d)
        expect(s.data.readNumber("damage_count_key", 0)).toBe(10)
      })
    })
  })

  describe("無効化の影響", () => {

    test("無効化の影響-てすと", () => {

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
      let tesuto = DencoManager.getDenco(context, "EX04", 50)
      sheena.maxHp = 1000
      sheena.currentHp = 1000
      sheena.ap = 1000
      let defense = initUser(context, "user", [sheena, tesuto])
      defense = activateSkill(context, defense, 1)
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
      // あたるのATK増加は無効化
      expect(hasSkillTriggered(result, "defense", sheena)).toBe(true)
      expect(hasSkillTriggered(result, "defense", tesuto)).toBe(true)
      expect(hasSkillTriggered(result, "offense", ataru)).toBe(false)
      expect(result.attackPercent).toBe(0)

      const t = getSkillTrigger(result, "offense", ataru)[0]
      expect(t.probability).toBe(100)
      expect(t.boostedProbability).toBe(0)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
      expect(t.skillName).toBe("ゆずれないプライド Lv.4")

      // カウント増減はスキルの無効化関係なく行われる
      // カウントを確認 10 - 2
      let s = getSkill(d)
      expect(s.data.readNumber("damage_count_key", 0)).toBe(8)
    })

    test("無効化の影響-エリア", () => {

      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let seria = DencoManager.getDenco(context, "1", 50)
      let ataru = DencoManager.getDenco(context, "46", 50, 1)
      let offense = initUser(context, "とあるマスター", [ataru, seria])
      offense = activateSkill(context, offense, 0)

      // 被アクセス
      offense = repeatAccess(context, offense, 10)

      // アクセス  
      let eria = DencoManager.getDenco(context, "33", 50, 1)
      let defense = initUser(context, "user", [eria])
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
        station: eria.link[0],
      }
      const result = startAccess(context, config)
      // あたるのATK増加は無効化
      expect(hasSkillTriggered(result, "defense", eria)).toBe(true)
      expect(hasSkillTriggered(result, "offense", ataru)).toBe(false)
      expect(result.attackPercent).toBe(0)

      const t = getSkillTrigger(result, "offense", ataru)[0]
      expect(t.probability).toBe(100)
      expect(t.boostedProbability).toBe(0)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
      expect(t.skillName).toBe("ゆずれないプライド Lv.4")
    })
  })
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