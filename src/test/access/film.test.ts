import assert from "assert"
import dayjs from "dayjs"
import { activateSkill, hasSkillTriggered, init } from "../.."
import { AccessConfig, getAccessDenco, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser, refreshState } from "../../core/user"
import "../../gen/matcher"

// デフォルトの計算式を使用する
const accessScore = 100
const linkSuccessScore = 100

describe("アクセス処理のフィルム補正", () => {
  beforeAll(init)

  describe("ATK,DEF増減", () => {
    test("通常", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      reika.film = {
        type: "film",
        theme: "theme",
        attackPercent: 5,
        defendPercent: 10,
      }
      let charlotte = DencoManager.getDenco(context, "6", 80, 3)
      charlotte.film = {
        type: "film",
        theme: "theme",
        attackPercent: 15,
        defendPercent: 20,
      }
      const offense = initUser(context, "とあるマスター１", [
        reika
      ])
      const defense = initUser(context, "とあるマスター２", [
        charlotte
      ])
      const config: AccessConfig = {
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
      expect(result.offense.event.length).toBe(1)
      // アクセス処理の確認
      expect(result.pinkMode).toBe(false)
      expect(result.attackPercent).toBe(5)
      expect(result.defendPercent).toBe(20)
      // ダメージ計算確認
      expect(reika.ap).toBe(200)
      expect(result.damageBase?.variable).toBe(Math.floor(200 * 0.85 * 1.3))
      expect(result.damageFixed).toBe(0)
    })

    test("カウンター攻撃あり", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let sheena = DencoManager.getDenco(context, "7", 50, 3)
      reika.film = {
        type: "film",
        theme: "theme",
        attackPercent: 5,
        defendPercent: 10,
      }
      sheena.film = {
        type: "film",
        theme: "theme",
        attackPercent: 15,
        defendPercent: 20,
      }
      let offense = initUser(context, "とあるマスター１", [
        reika
      ])
      let defense = initUser(context, "とあるマスター２", [
        sheena
      ])
      const config: AccessConfig = {
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
      context.random.mode = "force"
      const result = startAccess(context, config)
      // アクセス処理の確認
      expect(result.pinkMode).toBe(false)
      // ダメージ計算確認 最初の攻撃の計算
      expect(result.attackPercent).toBe(5)
      expect(result.defendPercent).toBe(20)
      expect(reika.ap).toBe(200)
      expect(sheena.ap).toBe(160)
      expect(result.damageBase?.variable).toBe(Math.floor(200 * 0.85))
      expect(result.damageFixed).toBe(0)
      // 最終ダメージ
      expect(result.defense!.formation[0].damage!.value).toBe(Math.floor(200 * 0.85))
      expect(result.offense!.formation[0].damage!.value).toBe(Math.floor(160 * 1.05))
    })
  })

  describe("経験値増減", () => {
    test("リブートなし", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 3)
      reika.film = {
        type: "film",
        theme: "theme",
        expPercent: 10
      }
      charlotte.film = {
        type: "film",
        theme: "theme",
        expPercent: 5
      }
      const offense = initUser(context, "とあるマスター１", [
        reika
      ])
      const defense = initUser(context, "とあるマスター２", [
        charlotte
      ])
      const config: AccessConfig = {
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
      // スコア＆経験値
      expect(result.offense.score.total).toBe(accessScore + 260)// アクセス＋ダメージ量のスコア
      expect(result.offense.score.access.total).toBe(accessScore + 260)
      expect(result.offense.score.access.accessBonus).toBe(accessScore)
      expect(result.offense.score.access.damageBonus).toBe(260)
      expect(result.offense.score.access.linkBonus).toBe(0)
      expect(result.offense.score.skill).toBe(0)
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.displayedScore).toBe(accessScore + 260)
      expect(result.offense.displayedExp).toBe(Math.floor((accessScore + 260) * 1.1))
      expect(result.defense?.score.total).toBe(0)
      expect(result.defense?.score.access.total).toBe(0)
      expect(result.defense?.score.skill).toBe(0)
      expect(result.defense?.score.link).toBe(0)
      expect(result.defense?.displayedScore).toBe(0)
      expect(result.defense?.displayedExp).toBe(0)
      // 攻守でんこのアクセス状態
      let d = getAccessDenco(result, "offense")
      expect(d.exp.total).toBe(d.exp.access.total)
      expect(d.expPercent).toMatchObject({
        access: 10,
        accessBonus: 0,
        damageBonus: 0,
        linkBonus: 0,
        link: 10,
      })
      expect(d.exp.access.total).toBe(Math.floor((accessScore + 260) * 1.1))
      expect(d.exp.access.accessBonus).toBe(Math.floor(accessScore * 1.1))
      expect(d.exp.access.damageBonus).toBe(Math.floor(260 * 1.1))
      expect(d.exp.access.linkBonus).toBe(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      d = getAccessDenco(result, "defense")
      expect(d.exp.total).toBe(0)
      expect(d.expPercent).toMatchObject({
        access: 5,
        accessBonus: 0,
        damageBonus: 0,
        linkBonus: 0,
        link: 5,
      })
      expect(d.exp.access.total).toBe(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
    })

    test("フットバース", () => {
      const context = initContext("test", "test", false)
      const now = context.currentTime
      context.clock = now

      let reika = DencoManager.getDenco(context, "5", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 3)
      reika.film = {
        type: "film",
        theme: "theme",
        expPercent: 10
      }
      charlotte.film = {
        type: "film",
        theme: "theme",
        expPercent: 5
      }
      const offense = initUser(context, "とあるマスター１", [
        reika
      ])
      const defense = initUser(context, "とあるマスター２", [
        charlotte
      ])
      const config: AccessConfig = {
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
      // スコア＆経験値
      expect(result.offense.score.total).toBe(accessScore + linkSuccessScore)// アクセス＋リンク成功
      expect(result.offense.score.access.total).toBe(accessScore + linkSuccessScore)
      expect(result.offense.score.access.accessBonus).toBe(accessScore)
      expect(result.offense.score.access.damageBonus).toBe(0)
      expect(result.offense.score.access.linkBonus).toBe(linkSuccessScore)
      expect(result.offense.score.skill).toBe(0)
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.displayedScore).toBe(accessScore + linkSuccessScore)
      expect(result.offense.displayedExp).toBe(Math.floor((accessScore + linkSuccessScore) * 1.1))
      const disconnect = getAccessDenco(result, "defense").disconnectedLink!
      expect(disconnect.link.length).toBe(1) // フットバされたリンク単体
      const link = disconnect.link[0]
      expect(disconnect.totalScore).toBe(link.totalScore)
      expect(disconnect.exp).toBe(link.exp)
      // 単純な合計＊フィルム補正
      expect(link.comboBonus).toBe(0)
      expect(link.totalScore).toBe(link.linkScore + link.matchBonus)
      expect(link.exp).toBe(Math.floor((link.linkScore + link.matchBonus) * 1.05))
      expect(result.defense?.score.total).toBe(disconnect.totalScore)
      expect(result.defense?.score.access.total).toBe(0)
      expect(result.defense?.score.skill).toBe(0)
      expect(result.defense?.score.link).toBe(disconnect.totalScore)
      expect(result.defense?.displayedScore).toBe(disconnect.totalScore)
      expect(result.defense?.displayedExp).toBe(disconnect.exp)
      // 攻守でんこのアクセス状態
      let d = getAccessDenco(result, "offense")
      expect(d.exp.total).toBe(Math.floor((accessScore + linkSuccessScore) * 1.1))
      expect(d.expPercent).toMatchObject({
        access: 10,
        accessBonus: 0,
        damageBonus: 0,
        linkBonus: 0,
        link: 10,
      })
      expect(d.exp.access.total).toBe(Math.floor((accessScore + linkSuccessScore) * 1.1))
      expect(d.exp.access.accessBonus).toBe(Math.floor((accessScore) * 1.1))
      expect(d.exp.access.damageBonus).toBe(0)
      expect(d.exp.access.linkBonus).toBe(Math.floor((linkSuccessScore) * 1.1))
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      d = getAccessDenco(result, "defense")
      expect(d.exp.total).toBe(disconnect.exp)
      expect(d.expPercent).toMatchObject({
        access: 5,
        accessBonus: 0,
        damageBonus: 0,
        linkBonus: 0,
        link: 5,
      })
      expect(d.exp.access.total).toBe(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(disconnect.exp)
    })

    test("リブートあり", () => {
      const context = initContext("test", "test", false)
      const now = context.currentTime
      context.clock = now

      let reika = DencoManager.getDenco(context, "5", 80)
      let charlotte = DencoManager.getDenco(context, "6", 80, 3)
      reika.film = {
        type: "film",
        theme: "theme",
        expPercent: 10
      }
      charlotte.film = {
        type: "film",
        theme: "theme",
        expPercent: 5
      }
      const offense = initUser(context, "とあるマスター１", [
        reika
      ])
      const defense = initUser(context, "とあるマスター２", [
        charlotte
      ])
      const config: AccessConfig = {
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
      // スコア＆経験値
      expect(result.damageBase?.variable).toBe(338)
      expect(result.damageBase?.constant).toBe(0)
      expect(result.offense.score.total).toBe(accessScore + 338 + linkSuccessScore)// アクセス＋ダメージ量＋リンク成功
      expect(result.offense.score.access.total).toBe(accessScore + 338 + linkSuccessScore)
      expect(result.offense.score.access.accessBonus).toBe(accessScore)
      expect(result.offense.score.access.damageBonus).toBe(338)
      expect(result.offense.score.access.linkBonus).toBe(linkSuccessScore)
      expect(result.offense.score.skill).toBe(0)
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.displayedScore).toBe(accessScore + 338 + linkSuccessScore)
      expect(result.offense.displayedExp).toBe(Math.floor((accessScore + 338 + linkSuccessScore) * 1.1))
      const disconnect = getAccessDenco(result, "defense").disconnectedLink!
      expect(disconnect.link.length).toBe(3) // リンクすべて解除
      expect(result.defense?.score.total).toBe(disconnect.totalScore)
      expect(result.defense?.score.access.total).toBe(0)
      expect(result.defense?.score.skill).toBe(0)
      expect(result.defense?.score.link).toBe(disconnect.totalScore)
      expect(result.defense?.displayedScore).toBe(disconnect.link[0].totalScore) // アクセス駅のリンクのみ
      expect(result.defense?.displayedExp).toBe(disconnect.link[0].exp)
      // 攻守でんこのアクセス状態
      let d = getAccessDenco(result, "offense")
      expect(d.exp.total).toBe(Math.floor((accessScore + 338 + linkSuccessScore) * 1.1))
      expect(d.expPercent).toMatchObject({
        access: 10,
        accessBonus: 0,
        damageBonus: 0,
        linkBonus: 0,
        link: 10,
      })
      expect(d.exp.access.total).toBe(d.exp.total)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      d = getAccessDenco(result, "defense")
      expect(d.exp.total).toBe(disconnect.exp)
      expect(d.expPercent).toMatchObject({
        access: 5,
        accessBonus: 0,
        damageBonus: 0,
        linkBonus: 0,
        link: 5,
      })
      expect(d.exp.total).toBeGreaterThan(disconnect.totalScore) // 5%アップ
      // 各リンク個別に補正が効くため合計の5%アップではない
      const v = Math.floor(disconnect.totalScore * 1.05)
      expect(d.exp.total).toBeLessThanOrEqual(v)
      expect(d.exp.total).toBeGreaterThanOrEqual(v - 3)
      expect(d.exp.access.total).toBe(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(disconnect.exp)
    })
  })

  describe("スキルプロパティの増減", () => {
    test("ルナ", () => {
      const context = initContext("test", "test", false)
      context.clock = dayjs('2022-01-01T23:00:00+0900').valueOf()
      let luna = DencoManager.getDenco(context, "3", 50, 1)
      luna.film = {
        type: "film",
        theme: "theme",
        skill: {
          DEF_night: 20
        }
      }
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let defense = initUser(context, "とあるマスター", [luna])
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
        station: luna.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, luna)).toBe(true)
      expect(result.defendPercent).toBe(25 + 20)
    })
    test("発動あり-攻撃側", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let reika = DencoManager.getDenco(context, "5", 50)
      reika.film = {
        type: "film",
        theme: "theme",
        skill: {
          ATK: 10
        }
      }
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [reika, seria])
      offense = activateSkill(context, offense, 0)
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
      expect(hasSkillTriggered(result.offense, reika)).toBe(true)
      expect(result.attackPercent).toBe(25 + 10)
    })
  })

  describe("発動確率の増減", () => {
    // 通常アクセス
    test("ルナ-発動あり", () => {
      const context = initContext("test", "test", false)
      context.clock = dayjs('2022-01-01T23:00:00+0900').valueOf()
      context.random.mode = "force"
      let luna = DencoManager.getDenco(context, "3", 50, 1)
      luna.film = {
        type: "film",
        theme: "theme",
        skill: {
          probability: -20
        }
      }
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let defense = initUser(context, "とあるマスター", [luna, hiiru])
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
        station: luna.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, luna)).toBe(true)
      expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
      expect(result.defendPercent).toBe(25)
    })
    test("ルナ-発動なし", () => {
      const context = initContext("test", "test", false)
      context.clock = dayjs('2022-01-01T23:00:00+0900').valueOf()
      context.random.mode = "ignore"
      let luna = DencoManager.getDenco(context, "3", 50, 1)
      luna.film = {
        type: "film",
        theme: "theme",
        skill: {
          probability: -20
        }
      }
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let defense = initUser(context, "とあるマスター", [luna, hiiru])
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
        station: luna.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, luna)).toBe(false)
      expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
      expect(result.defendPercent).toBe(0)
    })

    // イベント型
    test("シャルロッテ-発動あり", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start
      context.random.mode = "force"
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      charlotte.film = {
        type: "film",
        theme: "theme",
        skill: {
          // シャル砲発動まで待機時間を60分短縮 90 > 30分
          timer: -3600,
          cooldown: -3600,
          probability: -20
        }
      }
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let state = initUser(context, "とあるマスター", [charlotte, hiiru])
      state = activateSkill(context, state, 0, 1)

      context.clock = start + 1800 * 1000
      state = refreshState(context, state)

      expect(state.event.length).toBe(3)
      let e = state.event[0]
      assert(e.type === "skill_trigger")
      expect(e.data.step).toBe("probability_check")
      expect(e.data.denco).toMatchDenco(hiiru)
      e = state.event[1]
      assert(e.type === "access")
      e = state.event[2]
      assert(e.type === "skill_trigger")
      expect(e.data.step).toBe("self")
      expect(e.data.denco).toMatchDenco(charlotte)

    })
    test("シャルロッテ-発動なし", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start
      context.random.mode = "ignore"
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      charlotte.film = {
        type: "film",
        theme: "theme",
        skill: {
          // シャル砲発動まで待機時間を60分短縮 90 > 30分
          timer: -3600,
          cooldown: -3600,
          probability: -20
        }
      }
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let state = initUser(context, "とあるマスター", [charlotte, hiiru])
      state = activateSkill(context, state, 0, 1)

      context.clock = start + 1800 * 1000
      state = refreshState(context, state)

      expect(state.event.length).toBe(0)
    })
  })
})