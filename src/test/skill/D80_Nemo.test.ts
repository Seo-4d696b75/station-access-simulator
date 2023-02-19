import assert from "assert"
import { init } from "../.."
import { getAccessDenco, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, getSkill, isSkillActive } from "../../core/skill"
import { initUser, refreshState } from "../../core/user"
import "../../gen/matcher"

describe("ねものスキル", () => {
  beforeAll(init)

  describe("固定ダメージ", () => {

    test("発動あり-アクセス", () => {
      const context = initContext("test", "test", false)
      let nemo = DencoManager.getDenco(context, "80", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [nemo, siira])
      expect(isSkillActive(offense.formation[0].skill)).toBe(true)
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "とあるマスター２", [miroku])
      let config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: miroku.link[0],
      }
      context.random.mode = "force"
      const result = startAccess(context, config)
      assert(result.defense)
      expect(hasSkillTriggered(result, "offense", nemo)).toBe(true)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(140)
    })
    test("発動なし-アクセス編成内", () => {
      const context = initContext("test", "test", false)
      let nemo = DencoManager.getDenco(context, "80", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [siira, nemo])
      expect(isSkillActive(offense.formation[1].skill)).toBe(true)
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "とあるマスター２", [miroku])
      let config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: miroku.link[0],
      }
      context.random.mode = "force"
      const result = startAccess(context, config)
      assert(result.defense)
      expect(hasSkillTriggered(result, "offense", nemo)).toBe(false)
      expect(result.attackPercent).toBe(0)
      expect(result.damageFixed).toBe(0)
    })
  })

  describe("スキル状態遷移", () => {

    test("リンク成功", () => {
      const context = initContext("test", "test", false)
      let nemo = DencoManager.getDenco(context, "80", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [nemo, siira])
      // autoタイプだけどunable => active即座に状態遷移
      // 初期化 => active => cooldown => (unable) => active
      let skill = getSkill(offense.formation[0])
      expect(skill.transitionType).toBe("auto")
      expect(skill.transition.state).toBe("active")

      // スキルactive継続
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "とあるマスター２", [miroku])
      let config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: miroku.link[0],
      }
      context.random.mode = "force"
      let result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      // イベント記録確認
      expect(result.offense.event.length).toBe(2)
      let e = result.offense.event[0]
      expect(e.type).toBe("access")
      e = result.offense.event[1]
      assert(e.type === "skill_trigger")
      expect(e.data.denco.who).toBe("self")
      expect(e.data.denco.carIndex).toBe(0)
      expect(e.data.time).toBe(result.time)
      expect(e.data.skillName).toBe("蒼華一撃 Lv.4")
      let d = result.offense.formation[0]
      expect(e.data.denco).toMatchDencoState(d)
      // active継続
      skill = getSkill(d)
      expect(skill.transition.state).toBe("active")


      // スキルactive継続失敗
      offense = result.offense
      miroku = DencoManager.getDenco(context, "4", 50, 1)
      defense = initUser(context, "とあるマスター２", [miroku])
      config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: miroku.link[0],
      }
      let start = context.currentTime
      context.clock = start
      context.random.mode = "ignore"
      result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      // イベント記録確認（失敗時は表示なし）
      expect(result.offense.event.length).toBe(3)
      e = result.offense.event[2]
      expect(e.type).toBe("access")
      // cooldown
      d = result.offense.formation[0]
      skill = getSkill(d)
      assert(skill.transition.state === "cooldown")
      expect(skill.transition.data.cooldownTimeout).toBe(start + 10800 * 1000)

      // cooldown終了 > active
      offense = result.offense
      context.clock = start + 10800 * 1000
      offense = refreshState(context, offense)
      skill = getSkill(offense.formation[0])
      expect(skill.transition.state).toBe("active")
    })

    test("相手不在", () => {
      const context = initContext("test", "test", false)
      let nemo = DencoManager.getDenco(context, "80", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [nemo, siira])
      // autoタイプだけどunable => active即座に状態遷移
      // 初期化 => active => cooldown => (unable) => active
      let skill = getSkill(offense.formation[0])
      expect(skill.transitionType).toBe("auto")
      expect(skill.transition.state).toBe("active")

      // 不在でもリンク成功時はスキル継続の判定あり
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: undefined,
        station: miroku.link[0],
      }
      context.random.mode = "ignore"
      let result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      // イベント記録確認
      expect(result.offense.event.length).toBe(1)
      let e = result.offense.event[0]
      expect(e.type).toBe("access")
      // cooldown
      skill = getSkill(result.offense.formation[0])
      expect(skill.transition.state).toBe("cooldown")
    })
    test("足湯", () => {
      const context = initContext("test", "test", false)
      let nemo = DencoManager.getDenco(context, "80", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [nemo, siira])
      // autoタイプだけどunable => active即座に状態遷移
      // 初期化 => active => cooldown => (unable) => active
      let skill = getSkill(offense.formation[0])
      expect(skill.transitionType).toBe("auto")
      expect(skill.transition.state).toBe("active")

      // 足湯でもリンク成功時はスキル継続の判定あり
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "user", [miroku])
      let config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0,
        },
        station: miroku.link[0],
        usePink: true,
      }
      context.random.mode = "ignore"
      let result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      expect(result.pinkMode).toBe(true)
      // イベント記録確認
      expect(result.offense.event.length).toBe(1)
      let e = result.offense.event[0]
      expect(e.type).toBe("access")
      // cooldown
      skill = getSkill(result.offense.formation[0])
      expect(skill.transition.state).toBe("cooldown")
    })

    describe("リンク失敗", () => {

      test("相手をリブートできず", () => {
        const context = initContext("test", "test", false)
        let nemo = DencoManager.getDenco(context, "80", 50)
        let siira = DencoManager.getDenco(context, "11", 50)
        let offense = initUser(context, "とあるマスター", [nemo, siira])

        let miroku = DencoManager.getDenco(context, "4", 80, 1)
        let defense = initUser(context, "user", [miroku])
        let config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0,
          },
          station: miroku.link[0],
        }
        context.random.mode = "ignore"
        let result = startAccess(context, config)
        expect(result.linkSuccess).toBe(false)
        // リンク失敗時はスキル継続の判定処理自体が行われない
        // イベント記録確認
        expect(result.offense.event.length).toBe(1)
        let e = result.offense.event[0]
        expect(e.type).toBe("access")
        let skill = getSkill(result.offense.formation[0])
        expect(skill.transition.state).toBe("active")
      })

      test("カウンター", () => {
        const context = initContext("test", "test", false)
        let nemo = DencoManager.getDenco(context, "80", 50)
        let siira = DencoManager.getDenco(context, "11", 50)
        let offense = initUser(context, "とあるマスター", [nemo, siira])

        let marika = DencoManager.getDenco(context, "58", 50, 1)
        let defense = initUser(context, "user", [marika])
        defense = activateSkill(context, defense, 0)
        let config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0,
          },
          station: marika.link[0],
        }
        context.random.mode = "ignore"
        let result = startAccess(context, config)
        expect(result.linkSuccess).toBe(false)
        expect(hasSkillTriggered(result, "offense", nemo)).toBe(true)
        expect(hasSkillTriggered(result, "defense", marika)).toBe(true)
        let d = getAccessDenco(result, "offense")
        expect(d.reboot).toBe(true)
        d = getAccessDenco(result, "defense")
        expect(d.reboot).toBe(true)
        // リンク失敗時はスキル継続の判定処理自体が行われない
        // イベント記録確認
        expect(result.offense.event.length).toBe(2)
        let e = result.offense.event[0]
        expect(e.type).toBe("access")
        e = result.offense.event[1]
        assert(e.type === "reboot")
        expect(e.data.denco).toMatchDenco(nemo)
        let skill = getSkill(result.offense.formation[0])
        expect(skill.transition.state).toBe("active")
      })

    })

    test("リンク成功-確率ブースト", () => {
      const context = initContext("test", "test", false)
      let nemo = DencoManager.getDenco(context, "80", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let offense = initUser(context, "とあるマスター", [nemo, siira, hiiru])
      offense = activateSkill(context, offense, 2)

      // active継続
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "user", [miroku])
      let config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0,
        },
        station: miroku.link[0],
      }
      context.random.mode = "force"
      let result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      expect(hasSkillTriggered(result, "offense", nemo)).toBe(true)
      expect(hasSkillTriggered(result, "offense", hiiru)).toBe(false)
      // イベント記録確認
      expect(result.offense.event.length).toBe(3)
      let e = result.offense.event[0]
      expect(e.type).toBe("access")
      e = result.offense.event[1]
      assert(e.type === "skill_trigger")
      expect(e.data.denco).toMatchDenco(hiiru)
      expect(e.data.skillName).toBe("テンションAGEAGE↑↑ Lv.4")
      e = result.offense.event[2]
      assert(e.type === "skill_trigger")
      expect(e.data.denco).toMatchDenco(nemo)
      expect(e.data.skillName).toBe("蒼華一撃 Lv.4")
      let skill = getSkill(result.offense.formation[0])
      expect(skill.transition.state).toBe("active")


      // active継続失敗
      offense = result.offense
      miroku = DencoManager.getDenco(context, "4", 50, 1)
      defense = initUser(context, "user", [miroku])
      config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0,
        },
        station: miroku.link[0],
      }
      context.random.mode = "ignore"
      result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      expect(hasSkillTriggered(result, "offense", nemo)).toBe(true)
      expect(hasSkillTriggered(result, "offense", hiiru)).toBe(false)
      // イベント記録確認
      expect(result.offense.event.length).toBe(4)
      e = result.offense.event[3]
      expect(e.type).toBe("access")
      skill = getSkill(result.offense.formation[0])
      expect(skill.transition.state).toBe("cooldown")
    })

    describe("スキル継続判定処理はスキル無効化の影響なし", () => {
      // リンク成功時のコールバックから処理するためアクセス中の無効化の影響なし
      test("継続失敗", () => {
        const context = initContext("test", "test", false)
        let nemo = DencoManager.getDenco(context, "80", 50)
        let siira = DencoManager.getDenco(context, "11", 50)
        let offense = initUser(context, "とあるマスター", [nemo, siira])

        let miroku = DencoManager.getDenco(context, "4", 10, 1)
        let mahiru = DencoManager.getDenco(context, "EX02", 50)
        mahiru.film = {
          type: "film",
          theme: "test",
          skill: {
            probability: 50 // 発動確率+50%で100%発動に調整
          }
        }
        let defense = initUser(context, "user", [miroku, mahiru])
        defense = activateSkill(context, defense, 1)
        let config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0,
          },
          station: miroku.link[0],
        }
        context.random.mode = "ignore"
        let result = startAccess(context, config)
        expect(result.linkSuccess).toBe(true)
        expect(hasSkillTriggered(result, "offense", nemo)).toBe(false)
        expect(hasSkillTriggered(result, "defense", mahiru)).toBe(true)
        expect(result.damageFixed).toBe(0)

        let t = getSkillTrigger(result, "offense", nemo)[0]
        expect(t.skillName).toBe("蒼華一撃 Lv.4")
        expect(t.type).toBe("damage_fixed")
        expect(t.invalidated).toBe(true)
        expect(t.triggered).toBe(false)
        
        // イベント記録確認
        expect(result.offense.event.length).toBe(1)
        let e = result.offense.event[0]
        expect(e.type).toBe("access")
        // cooldown
        let skill = getSkill(result.offense.formation[0])
        expect(skill.transition.state).toBe("cooldown")
      })
      test("継続成功", () => {
        const context = initContext("test", "test", false)
        let nemo = DencoManager.getDenco(context, "80", 50)
        let siira = DencoManager.getDenco(context, "11", 50)
        let offense = initUser(context, "とあるマスター", [nemo, siira])

        let miroku = DencoManager.getDenco(context, "4", 10, 1)
        let mahiru = DencoManager.getDenco(context, "EX02", 50)
        let defense = initUser(context, "user", [miroku, mahiru])
        defense = activateSkill(context, defense, 1)
        let config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0,
          },
          station: miroku.link[0],
        }
        context.random.mode = "force"
        let result = startAccess(context, config)
        expect(result.linkSuccess).toBe(true)
        expect(hasSkillTriggered(result, "offense", nemo)).toBe(false)
        expect(hasSkillTriggered(result, "defense", mahiru)).toBe(true)
        expect(result.damageFixed).toBe(0)
        let t = getSkillTrigger(result, "offense", nemo)[0]
        expect(t.skillName).toBe("蒼華一撃 Lv.4")
        expect(t.type).toBe("damage_fixed")
        expect(t.invalidated).toBe(true)
        expect(t.triggered).toBe(false)

        // イベント記録確認
        expect(result.offense.event.length).toBe(2)
        let e = result.offense.event[0]
        expect(e.type).toBe("access")
        e = result.offense.event[1]
        assert(e.type === "skill_trigger")
        expect(e.data.skillName).toBe("蒼華一撃 Lv.4")
        // active
        let skill = getSkill(result.offense.formation[0])
        expect(skill.transition.state).toBe("active")
      })
    })
  })
})