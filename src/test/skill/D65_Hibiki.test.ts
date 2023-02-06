import assert from "assert"
import { init } from "../.."
import { getAccessDenco, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { getFixedDamageDenco } from "../tool/fake"
import { testAlwaysSkill } from "../tool/skillState"

describe("ひびきのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "65",
    name: "hibiki"
  })

  describe("サポーターの無効化", () => {

    test("発動あり-守備側(被アクセス)", () => {
      const context = initContext("test", "test", false)
      let fubu = DencoManager.getDenco(context, "14", 50)
      let mio = DencoManager.getDenco(context, "36", 50)
      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let reika = DencoManager.getDenco(context, "5", 50)
      let defense = initUser(context, "とあるマスター", [hibiki, fubu, mio])
      defense = activateSkill(context, defense, 1, 2)
      let offense = initUser(context, "とあるマスター２", [charlotte, reika])
      offense = activateSkill(context, offense, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", hibiki)).toBe(true)
      expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
      expect(hasSkillTriggered(result, "defense", mio)).toBe(false)
      expect(hasSkillTriggered(result, "offense", reika)).toBe(true)
      // サポーターの無効化
      assert(result.defense)
      let t = getSkillTrigger(result, "defense", fubu)[0]
      expect(t.skillName).toBe("根性入れてやるかー Lv.4")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
      t = getSkillTrigger(result, "defense", mio)[0]
      expect(t.skillName).toBe("スタンドイン Lv.4")
      expect(t.probability).toBe(40)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
      // 相手編成のサポーターは無効化対象外
      t = getSkillTrigger(result, "offense", reika)[0]
      expect(t.skillName).toBe("起動加速度向上 Lv.4")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(false)
      expect(t.canTrigger).toBe(true)
      expect(t.triggered).toBe(true)

      expect(result.attackPercent).toBeGreaterThan(0)
    })

    test("発動なし-守備側(被アクセス)", () => {
      const context = initContext("test", "test", false)
      let fubu = DencoManager.getDenco(context, "14", 50)
      let mio = DencoManager.getDenco(context, "36", 50)
      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [hibiki, fubu, mio])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", hibiki)).toBe(false)
      // サポーターの無効化なし
      let t = getSkillTrigger(result, "defense", fubu)
      expect(t.length).toBe(0)
      t = getSkillTrigger(result, "defense", mio)
      expect(t.length).toBe(0)

      expect(result.defendPercent).toBe(0)
    })
    test("発動あり-守備側(被アクセス)-サポーター以外", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      
      let seria = DencoManager.getDenco(context, "1", 50)
      let mero = DencoManager.getDenco(context, "2", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let moe = DencoManager.getDenco(context, "9", 50)
      let koyoi = DencoManager.getDenco(context, "74", 50)
      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      hibiki.currentHp = 220 // アクセス後にセリア回復対象になるよう調整
      let reika = DencoManager.getDenco(context, "5", 50)
      let defense = initUser(context, "とあるマスター", [hibiki, koyoi, seria, mero, moe])
      defense = activateSkill(context, defense, 1, 2)
      let offense = initUser(context, "とあるマスター２", [charlotte, reika])
      offense = activateSkill(context, offense, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", hibiki)).toBe(true)
      expect(hasSkillTriggered(result, "defense", koyoi)).toBe(true)
      // コヨイ対象外
      assert(result.defense)
      let t = getSkillTrigger(result, "defense", koyoi)[0]
      expect(t.skillName).toBe("なきむしシンパサイザー Lv.4")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(false)
      expect(t.canTrigger).toBe(true)
      expect(t.triggered).toBe(true)

      expect(result.defendPercent).toBe(10)

      // 相手編成のサポーターは無効化対象外
      t = getSkillTrigger(result, "offense", reika)[0]
      expect(t.skillName).toBe("起動加速度向上 Lv.4")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(false)
      expect(t.canTrigger).toBe(true)
      expect(t.triggered).toBe(true)

      expect(result.attackPercent).toBeGreaterThan(0)

      // セリア発動の無効化
      let d = getAccessDenco(result, "defense")
      expect(d.reboot).toBe(false)
      expect(d.currentHp).toBeLessThan(d.maxHp * 0.3)
      expect(result.defense.event.length).toBe(2)
      let e = result.defense.event[0]
      expect(e.type).toBe("access")
      // 編成順序の関係で自身の回復が先に発動処理される
      e = result.defense.event[1]
      assert(e.type === "skill_trigger")
      expect(e.data.skillName).toBe("シンフォニックレイル Lv.4")
    })

    describe("他の無効化スキルとの影響", () => {

      test("レン対象外", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        let fubu = DencoManager.getDenco(context, "14", 50)
        let mio = DencoManager.getDenco(context, "36", 50)
        let hibiki = DencoManager.getDenco(context, "65", 50, 1)
        let ren = DencoManager.getDenco(context, "22", 50)
        let defense = initUser(context, "とあるマスター", [hibiki, fubu, mio])
        defense = activateSkill(context, defense, 1, 2)
        let offense = initUser(context, "とあるマスター２", [ren])
        offense = activateSkill(context, offense, 0)
        const config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0
          },
          station: hibiki.link[0],
        }
        const result = startAccess(context, config)
        expect(result.defense).not.toBeUndefined()
        expect(hasSkillTriggered(result, "offense", ren)).toBe(false)
        expect(hasSkillTriggered(result, "defense", hibiki)).toBe(true)
        expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
        expect(hasSkillTriggered(result, "defense", mio)).toBe(false)
        // レンの無効化対象外
        assert(result.defense)
        let t = getSkillTrigger(result, "defense", hibiki)[0]
        expect(t.skillName).toBe("シンフォニックレイル Lv.4")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(false)
        expect(t.canTrigger).toBe(true)
        expect(t.triggered).toBe(true)
        // サポーターの無効化
        t = getSkillTrigger(result, "defense", fubu)[0]
        expect(t.skillName).toBe("根性入れてやるかー Lv.4")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(true)
        expect(t.canTrigger).toBe(false)
        expect(t.triggered).toBe(false)
        t = getSkillTrigger(result, "defense", mio)[0]
        expect(t.skillName).toBe("スタンドイン Lv.4")
        expect(t.probability).toBe(40)
        expect(t.invalidated).toBe(true)
        expect(t.canTrigger).toBe(false)
        expect(t.triggered).toBe(false)

        expect(result.defendPercent).toBe(0)
      })

      // 攻撃・守備側の順序で無効化スキルも発動するため、
      // まひるの編成側によって結果が変わる（編成内の位置にはよらない）
      // 参考：https://blog.ekimemo.com/post/179166914454/%E9%A7%85%E3%83%A1%E3%83%A2%E3%81%AE%E3%82%B9%E3%82%AD%E3%83%AB%E3%81%AE%E7%99%BA%E5%8B%95%E9%A0%86%E5%BA%8F%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6

      test("相手編成にまひる", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        let fubu = DencoManager.getDenco(context, "14", 50)
        let mio = DencoManager.getDenco(context, "36", 50)
        let hibiki = DencoManager.getDenco(context, "65", 50, 1)
        let mahiru = DencoManager.getDenco(context, "EX02", 50)
        let defense = initUser(context, "とあるマスター", [hibiki, fubu, mio])
        defense = activateSkill(context, defense, 1, 2)
        let offense = initUser(context, "とあるマスター２", [mahiru])
        offense = activateSkill(context, offense, 0)
        const config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0
          },
          station: hibiki.link[0],
        }
        const result = startAccess(context, config)
        expect(result.defense).not.toBeUndefined()
        // 攻撃側のecoスキル無効化が先に発動
        // ひびきの自編成サポーター無効化スキルは発動前に無効化され、発動なし
        expect(hasSkillTriggered(result, "offense", mahiru)).toBe(true)
        expect(hasSkillTriggered(result, "defense", hibiki)).toBe(false)
        expect(hasSkillTriggered(result, "defense", fubu)).toBe(true)
        expect(hasSkillTriggered(result, "defense", mio)).toBe(true)
        // ひびき無効化
        assert(result.defense)
        let t = getSkillTrigger(result, "defense", hibiki)[0]
        expect(t.skillName).toBe("シンフォニックレイル Lv.4")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(true)
        expect(t.canTrigger).toBe(false)
        expect(t.triggered).toBe(false)
        // サポーターの無効化なし
        t = getSkillTrigger(result, "defense", fubu)[0]
        expect(t.skillName).toBe("根性入れてやるかー Lv.4")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(false)
        expect(t.canTrigger).toBe(true)
        expect(t.triggered).toBe(true)
        t = getSkillTrigger(result, "defense", mio)[0]
        expect(t.skillName).toBe("スタンドイン Lv.4")
        expect(t.probability).toBe(40)
        expect(t.invalidated).toBe(false)
        expect(t.canTrigger).toBe(true)
        expect(t.triggered).toBe(true)

        expect(result.defendPercent).toBeGreaterThan(0)
      })
      test("自編成にまひる", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        let fubu = DencoManager.getDenco(context, "14", 50)
        let mio = DencoManager.getDenco(context, "36", 50)
        let hibiki = DencoManager.getDenco(context, "65", 50, 1)
        let mahiru = DencoManager.getDenco(context, "EX02", 50)
        let hiiru = DencoManager.getDenco(context, "34", 50)
        let imura = DencoManager.getDenco(context, "19", 50)
        let defense = initUser(context, "とあるマスター", [hibiki, mahiru, fubu, mio, hiiru])
        defense = activateSkill(context, defense, 1, 2, 3, 4)
        let offense = initUser(context, "とあるマスター２", [imura])
        offense = activateSkill(context, offense, 0)
        const config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0
          },
          station: hibiki.link[0],
        }
        const result = startAccess(context, config)
        expect(result.defense).not.toBeUndefined()
        // 同じ編成内のスキル無効化が両方発動
        // ひびきの無効化も発動する
        expect(hasSkillTriggered(result, "offense", imura)).toBe(false)
        expect(hasSkillTriggered(result, "defense", hibiki)).toBe(true)
        expect(hasSkillTriggered(result, "defense", mahiru)).toBe(true)
        expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
        expect(hasSkillTriggered(result, "defense", mio)).toBe(false)
        expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)
        // 確率ブースト（まひる発動率100%未満）は無効化の前に発動しているはず
        // TODO 現行のゲームではひいる発動していない
        // issue: https://github.com/Seo-4d696b75/station-access-simulator/issues/16
        expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)
        assert(result.defense)
        // eco無効化
        let t = getSkillTrigger(result, "defense", hibiki)[0]
        expect(t.skillName).toBe("シンフォニックレイル Lv.4")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(false)
        expect(t.canTrigger).toBe(true)
        expect(t.triggered).toBe(true)
        // ひびき発動
        t = getSkillTrigger(result, "offense", imura)[0]
        expect(t.skillName).toBe("紫電一閃 Lv.4")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(true)
        expect(t.canTrigger).toBe(false)
        expect(t.triggered).toBe(false)
        // サポーターの無効化
        t = getSkillTrigger(result, "defense", fubu)[0]
        expect(t.skillName).toBe("根性入れてやるかー Lv.4")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(true)
        expect(t.canTrigger).toBe(false)
        expect(t.triggered).toBe(false)
        t = getSkillTrigger(result, "defense", mio)[0]
        expect(t.skillName).toBe("スタンドイン Lv.4")
        expect(t.probability).toBe(40)
        expect(t.invalidated).toBe(true)
        expect(t.canTrigger).toBe(false)
        expect(t.triggered).toBe(false)

        expect(result.defendPercent).toBe(0)
      })

    })
  })

  describe("HP回復", () => {
    test("発動あり-守備側(被アクセス)", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      const now = context.currentTime
      context.clock = now

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [hibiki])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", hibiki)).toBe(false)
      // HP回復
      assert(result.defense)
      expect(result.defense.event.length).toBe(2)
      let e = result.defense.event[1]
      assert(e.type === "skill_trigger")
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
      expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.99)
      expect(e.data.denco.carIndex).toBe(0)
      expect(e.data.denco.who).toBe("self")
      expect(e.data.skillName).toBe("シンフォニックレイル Lv.4")
      expect(e.data.time).toBe(now)
      expect(e.data.denco).toMatchDencoState(d)
      const heal = Math.floor(d.maxHp * 0.15)
      expect(d.currentHp).toBe(d.hpAfter + heal)
    })

    test("発動あり-守備側(被アクセス)-確率ブースト", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      const now = context.currentTime
      context.clock = now

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [hibiki, hiiru])
      defense = activateSkill(context, defense, 1)
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      // アクセス中のスキル発動（サポータ無効化）は100%なのでひいる関係ない
      expect(hasSkillTriggered(result, "defense", hibiki)).toBe(true)
      expect(hasSkillTriggered(result, "defense", hiiru)).toBe(false)
      // HP回復
      assert(result.defense)
      expect(result.defense.event.length).toBe(2)
      // ひいるはサポーターなので直前のアクセスで無効化される！
      // ひびきの発動確率ブーストしない
      let e = result.defense.event[1]
      assert(e.type === "skill_trigger")
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
      expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.99)
      expect(e.data.denco.carIndex).toBe(0)
      expect(e.data.denco.who).toBe("self")
      expect(e.data.skillName).toBe("シンフォニックレイル Lv.4")
      expect(e.data.time).toBe(now)
      expect(e.data.denco).toMatchDencoState(d)
      const heal = Math.floor(d.maxHp * 0.15)
      expect(d.currentHp).toBe(d.hpAfter + heal)
    })

    test("発動なし-守備側(被アクセス)-確率", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [hibiki])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", hibiki)).toBe(false)
      // HP回復なし
      assert(result.defense)
      expect(result.defense.event.length).toBe(1)
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBe(d.maxHp - charlotte.ap)
      expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.99)
      expect(d.currentHp).toBe(d.hpAfter)
    })

    test("発動なし-守備側(被アクセス)-まひる相手（無効化）", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let ren = DencoManager.getDenco(context, "22", 50)
      let mahiru = DencoManager.getDenco(context, "EX02", 50)
      let defense = initUser(context, "とあるマスター", [hibiki])
      let offense = initUser(context, "とあるマスター２", [ren, mahiru])
      offense = activateSkill(context, offense, 0, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", hibiki)).toBe(false)
      expect(hasSkillTriggered(result, "offense", ren)).toBe(false)
      expect(hasSkillTriggered(result, "offense", mahiru)).toBe(true)
      // HP回復なし
      assert(result.defense)
      expect(result.defense.event.length).toBe(1)
      let d = result.defense.formation[0]

      expect(d.hpAfter).toBe(d.maxHp - Math.floor(ren.ap * 1.3))
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.99)
      expect(d.currentHp).toBe(d.hpAfter)
    })


    test("発動なし-守備側(被アクセス)-99%以上", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      charlotte.ap = 1
      let defense = initUser(context, "とあるマスター", [hibiki])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", hibiki)).toBe(false)
      // HP回復なし
      assert(result.defense)
      expect(result.defense.event.length).toBe(1)
      let d = result.defense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBe(d.maxHp - 1)
      expect(d.hpAfter).toBeGreaterThan(d.maxHp * 0.99)
      expect(d.currentHp).toBe(d.hpAfter)
    })
    test("発動なし-守備側(被アクセス)-HP変化なし", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"

      let hibiki = DencoManager.getDenco(context, "65", 50, 1)
      hibiki.currentHp = Math.floor(hibiki.maxHp * 0.99)
      let test = getFixedDamageDenco(-1000)
      test.type = "trickster" // サポーターだと無効化される
      let charlotte = DencoManager.getDenco(context, "6", 50)
      charlotte.ap = 100
      let defense = initUser(context, "とあるマスター", [hibiki, test])
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
        station: hibiki.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", hibiki)).toBe(false)
      // HP回復なし
      // 最大HPの99%以下でもアクセスで変化がないと発動しない
      assert(result.defense)
      expect(result.defense.event.length).toBe(1)
      let d = result.defense.formation[0]
      expect(d.damage?.value).toBe(0)
      expect(d.reboot).toBe(false)
      expect(d.hpAfter).toBe(d.hpBefore)
      expect(d.hpAfter).toBeLessThanOrEqual(d.maxHp * 0.99)
      expect(d.currentHp).toBe(d.hpAfter)
    })
  })
})