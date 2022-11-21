import { init } from "../.."
import { AccessConfig, getAccessDenco, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import "../matcher"

// デフォルトの計算式を使用する
const accessScore = 100
const linkSuccessScore = 100

describe("アクセス処理のフィルム補正", () => {
  beforeAll(init)

  test("ATK,DEFフィルム補正", () => {
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

  test("ATK,DEFフィルム補正-カウンター攻撃あり", () => {
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
  
  test("リブートなし-経験値フィルム補正あり", () => {
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
    expect(result.offense.score.access).toBe(accessScore + 260)// アクセス＋ダメージ量のスコア
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + 260)
    expect(result.offense.displayedExp).toBe(Math.floor((accessScore + 260) * 1.1))
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.score.skill).toBe(0)
    expect(result.defense?.score.link).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    // 攻守でんこのアクセス状態
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access).toBe(Math.floor((accessScore + 260) * 1.1))
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    d = getAccessDenco(result, "defense")
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
  })

  test("フットバース-経験値フィルム補正あり", () => {
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
    expect(result.offense.score.access).toBe(accessScore + linkSuccessScore)// アクセス＋リンク成功
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + linkSuccessScore)
    expect(result.offense.displayedExp).toBe(Math.floor((accessScore + linkSuccessScore) * 1.1))
    const link = charlotte.link[0]
    const linkScore = Math.floor((now - link.start) / 100)
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.score.skill).toBe(0)
    expect(result.defense?.score.link).toBe(linkScore)
    expect(result.defense?.displayedScore).toBe(linkScore)
    expect(result.defense?.displayedExp).toBe(Math.floor(linkScore * 1.05))
    // 攻守でんこのアクセス状態
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access).toBe(Math.floor((accessScore + linkSuccessScore) * 1.1))
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    d = getAccessDenco(result, "defense")
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(Math.floor(linkScore * 1.05))
  })

  test("リブートあり-経験値フィルム補正あり", () => {
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
    expect(result.offense.score.access).toBe(accessScore + 338 + linkSuccessScore)// アクセス＋ダメージ量＋リンク成功
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + 338 + linkSuccessScore)
    expect(result.offense.displayedExp).toBe(Math.floor((accessScore + 338 + linkSuccessScore) * 1.1))
    const link = charlotte.link[0]
    const linkScore = Math.floor((now - link.start) / 100)
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.score.skill).toBe(0)
    expect(result.defense?.score.link).toBe(getAccessDenco(result, "defense").disconnectedLink!.totalScore)
    expect(result.defense?.displayedScore).toBe(linkScore) // アクセス駅のリンクのみ
    expect(result.defense?.displayedExp).toBe(Math.floor(linkScore * 1.05))
    // 攻守でんこのアクセス状態
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access).toBe(Math.floor((accessScore + 338 + linkSuccessScore) * 1.1))
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    d = getAccessDenco(result, "defense")
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(d.disconnectedLink!.exp)
    expect(d.disconnectedLink!.exp).toBe(Math.floor(d.disconnectedLink!.totalScore * 1.05))
  })
})