import assert from "assert"
import dayjs from "dayjs"
import { init } from "../.."
import { AccessConfig, getAccessDenco, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { LinksResult } from "../../core/station"
import StationManager from "../../core/stationManager"
import { getTargetDenco, initUser } from "../../core/user"
import "../../gen/matcher"

// デフォルトの計算式を使用する
const accessScore = 100
const linkSuccessScore = 100
// ダメージ量に応じたスコア = Math.flor(damage)
// リンクスコア = Math.flow(リンク時間[ms]/100)
// 経験値 = score総量

describe("基本的なアクセス処理", () => {
  beforeAll(init)

  test("守備側なし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    const offense = initUser(context, "とあるマスター１", [
      reika
    ])
    const station = StationManager.getRandomStation(context, 1)[0]
    const config: AccessConfig = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: station,
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.offense.event[0].type).toBe("access")
    // 不在の確認
    expect(result.defense).toBeUndefined()
    // アクセス結果の確認
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(false)
    // アクセス処理の確認
    expect(result.pinkMode).toBe(false)
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    expect(result.damageBase?.variable).toBeUndefined()
    expect(result.damageFixed).toBe(0)
    const d = getAccessDenco(result, "offense")
    expect(d.name).toBe(reika.name)
    expect(d.numbering).toBe(reika.numbering)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(192)
    expect(d.currentHp).toBe(192)
    expect(d.link.length).toBe(1)
    expect(d.link[0]).toMatchObject(station)
    // スコア＆経験値
    expect(result.offense.score.access).toBe(accessScore + linkSuccessScore)
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + linkSuccessScore)
    expect(d.exp.access).toBe(accessScore + linkSuccessScore)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    expect(d.currentExp).toBe(reika.currentExp + accessScore + linkSuccessScore)
    expect(() => getAccessDenco(result, "defense")).toThrowError()
  })
  test("守備側なし-フットバースあり", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    const offense = initUser(context, "とあるマスター１", [
      reika
    ])
    const station = StationManager.getRandomStation(context, 1)[0]
    const config: AccessConfig = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: station,
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    expect(result.offense.event[0].type).toBe("access")
    // 不在の確認
    expect(result.defense).toBeUndefined()
    // アクセス結果の確認
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(false)
    expect(result.pinkItemSet).toBe(true)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.pinkMode).toBe(false)
    reika = result.offense.formation[0]
    expect(reika.link.length).toBe(1)
    expect(reika.link[0]).toMatchObject(station)
    // スコア＆経験値
    expect(result.offense.score.access).toBe(accessScore + linkSuccessScore)
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + linkSuccessScore)
    let d = getAccessDenco(result, "offense")
    expect(d.exp.access).toBe(accessScore + linkSuccessScore)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    expect(d.currentExp).toBe(accessScore + linkSuccessScore)
  })
  test("守備側あり-スキル発動なし-Rebootなし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
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
    // 相手の確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // アクセス結果の確認
    expect(result.linkSuccess).toBe(false)
    expect(result.linkDisconnected).toBe(false)
    // アクセス処理の確認
    expect(result.pinkMode).toBe(false)
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(result.damageBase?.variable).toBe(260)
    expect(result.damageFixed).toBe(0)
    // スコア＆経験値
    expect(result.offense.score.access).toBe(accessScore + 260)// アクセス＋ダメージ量のスコア
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + 260)
    expect(result.offense.displayedExp).toBe(accessScore + 260)
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.score.skill).toBe(0)
    expect(result.defense?.score.link).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    // 攻守でんこのアクセス状態
    let d = getAccessDenco(result, "offense")
    expect(d.name).toBe(reika.name)
    expect(d.numbering).toBe(reika.numbering)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(192)
    expect(d.damage).toBeUndefined()
    expect(d.currentHp).toBe(192)
    expect(d.exp.access).toBe(accessScore + 260)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    expect(d.currentExp).toBe(reika.currentExp + accessScore + 260)
    expect(d.ap).toBe(200)
    expect(d.link.length).toBe(0)
    d = getAccessDenco(result, "defense")
    expect(d.name).toBe(charlotte.name)
    expect(d.numbering).toBe(charlotte.numbering)
    expect(d.hpBefore).toBe(324)
    expect(d.hpAfter).toBe(64)
    expect(d.damage?.value).toBe(260)
    expect(d.damage?.attr).toBe(true)
    expect(d.currentHp).toBe(64)
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    expect(d.currentExp).toBe(charlotte.currentExp + 0)
    expect(d.link.length).toBe(3)
    // 最新の状態
    let reikaNow = result.offense.formation[0]
    expect(reikaNow.name).toBe("reika")
    expect(reikaNow.numbering).toBe("5")
    let exp = getAccessDenco(result, "offense").exp
    expect(reikaNow.currentExp).toBe(reika.currentExp + accessScore + 260)
    expect(reikaNow.currentHp).toBe(192)
    assert(result.defense)
    let charlotteNow = result.defense.formation[0]
    expect(charlotteNow.name).toBe("charlotte")
    expect(charlotteNow.numbering).toBe("6")
    exp = getAccessDenco(result, "defense").exp
    expect(charlotteNow.currentExp).toBe(charlotte.currentExp + 0)
    expect(charlotteNow.currentHp).toBe(64)

  })

  test("守備側あり-フットバースあり", () => {
    const context = initContext("test", "test", false)
    const now = dayjs().valueOf()
    context.clock = now
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    // レベルアップ阻害
    charlotte.nextExp = Number.MAX_SAFE_INTEGER
    const link = charlotte.link[0]
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
      station: link,
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    // 相手の確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // アクセス結果の確認
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)
    // アクセス処理の確認
    expect(result.pinkMode).toBe(true)
    expect(result.pinkItemSet).toBe(true)
    expect(result.pinkItemUsed).toBe(true)
    // ダメージ計算確認
    expect(result.damageBase?.variable).toBeUndefined()
    expect(result.damageFixed).toBe(0)
    // スコア＆経験値
    expect(result.offense.score.access).toBe(accessScore + linkSuccessScore)// アクセス＋リンク成功スコア  
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + linkSuccessScore)
    expect(result.offense.displayedExp).toBe(accessScore + linkSuccessScore)
    const linkScore = Math.floor((now - link.start) / 100)
    expect(result.defense?.score.access).toBe(0) // 解除したリンクスコア
    expect(result.defense?.score.skill).toBe(0)
    expect(result.defense?.score.link).toBe(linkScore)
    expect(result.defense?.displayedScore).toBe(linkScore)
    expect(result.defense?.displayedExp).toBe(linkScore)
    // 攻守でんこ
    let d = getAccessDenco(result, "offense")
    expect(d.damage).toBeUndefined()
    expect(d.exp.access).toBe(accessScore + linkSuccessScore)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    d = getAccessDenco(result, "defense")
    expect(d.damage).toBeUndefined()
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(linkScore)
    expect(d.reboot).toBe(false)
    expect(d.disconnectedLink).not.toBeUndefined()
    assert(d.disconnectedLink)
    expect(d.disconnectedLink.totalScore).toBe(linkScore) // フットバされたリンク
    expect(d.disconnectedLink.exp).toBe(linkScore)
    expect(d.disconnectedLink.link.length).toBe(1)
    expect(d.disconnectedLink.link[0]).toMatchObject(link)
    expect(d.disconnectedLink.time).toBe(result.time)
    //リンク解除済み＆経験値加算前の状態
    expect(d.disconnectedLink.denco).toMatchDencoState(
      { ...d, currentExp: 68000 } // 最大レベル80
    )

    // リンク
    reika = result.offense.formation[0]
    expect(reika.link.length).toBe(1)
    expect(reika.link[0]).toMatchObject({ ...link, start: now })
    // 最終状態の確認
    expect(result.defense).not.toBeUndefined()
    assert(result.defense)
    const charlotteResult = getTargetDenco(result.defense)
    charlotte = defense.formation[0]
    expect(charlotteResult).toMatchDencoState({
      ...charlotte,
      link: charlotte.link.slice(1),
      currentExp: charlotte.currentExp + linkScore,
    })
  })
  test("守備側あり-スキル発動なし-Rebootあり", () => {
    const context = initContext("test", "test", false)
    const now = dayjs().valueOf()
    context.clock = now
    let reika = DencoManager.getDenco(context, "5", 80)
    let charlotte = DencoManager.getDenco(context, "6", 50, 3)
    // レベルアップ阻害
    charlotte.nextExp = Number.MAX_SAFE_INTEGER
    const link = charlotte.link[0]
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
      station: link,
    }
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    // 相手の確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(2)
    // アクセス結果の確認
    expect(result.linkSuccess).toBe(true)
    expect(result.linkDisconnected).toBe(true)
    // アクセス処理の確認
    expect(result.pinkMode).toBe(false)
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(result.damageBase?.variable).toBe(338)
    expect(result.damageFixed).toBe(0)
    // スコア＆経験値
    expect(result.offense.score.access).toBe(accessScore + 338 + linkSuccessScore)// アクセス＋ダメージ量＋リンク成功スコア
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + 338 + linkSuccessScore)
    expect(result.offense.displayedExp).toBe(accessScore + 338 + linkSuccessScore)
    const linkScore = Math.floor((now - link.start) / 100)
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.score.skill).toBe(0)
    expect(result.defense?.score.link).toBeGreaterThan(linkScore) // 解除リンク全部
    expect(result.defense?.displayedScore).toBe(linkScore) // こっちはアクセス駅のリンクのみ
    expect(result.defense?.displayedExp).toBe(linkScore)
    let d = getAccessDenco(result, "offense")
    expect(d.name).toBe("reika")
    expect(d.numbering).toBe(reika.numbering)
    expect(d.hpBefore).toBe(312)
    expect(d.hpAfter).toBe(312)
    expect(d.currentHp).toBe(312)
    expect(d.exp.access).toBe(accessScore + 338 + linkSuccessScore)
    expect(d.exp.skill).toBe(0)
    expect(d.currentExp).toBe(68000) //　最大レベル
    expect(d.ap).toBe(260)
    expect(d.damage).toBeUndefined()
    // リンク
    expect(d.link.length).toBe(1)
    expect(d.link[0]).toMatchObject({ ...link, start: now })
    d = getAccessDenco(result, "defense")
    expect(d.name).toBe("charlotte")
    expect(d.numbering).toBe(charlotte.numbering)
    expect(d.hpBefore).toBe(228)
    expect(d.hpAfter).toBe(0)
    expect(d.currentHp).toBe(228)
    expect(d?.damage?.value).toBe(338)
    expect(d?.damage?.attr).toBe(true)
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.reboot).toBe(true)
    expect(d.disconnectedLink).not.toBeUndefined()
    assert(d.disconnectedLink)
    expect(d.disconnectedLink.link?.length).toBe(3)
    expect(d.disconnectedLink.denco).toMatchDencoState(
      { ...d, currentExp: charlotte.currentExp } // 経験値追加前
    )
    expect(result.defense?.score.link).toBe(d.disconnectedLink.totalScore)
    expect(d.exp.link).toBe(d.disconnectedLink.exp)
    expect(d.currentExp).toBe(charlotte.currentExp + d.disconnectedLink.exp)
    // リブート確認
    expect(d.link.length).toBe(0)
    let e = result.defense?.event[1]
    expect(e).not.toBeUndefined()
    assert(e?.type === "reboot")
    let data = e?.data
    expect(data.denco.name).toBe(charlotte.name)
    // リンク解除済み＆経験値加算前
    expect(data.denco).toMatchDencoState({ ...d, currentExp: 0 })
    expect(data.link.length).toBe(3)
    expect(data.link[0]).toMatchObject(link)
    expect(data).toMatchObject(d.disconnectedLink)
    // アクセス後の状態
    expect(result.defense).not.toBeUndefined()
    assert(result.defense)
    charlotte = defense.formation[0]
    let charlotteResult = getTargetDenco(result.defense)
    expect(charlotteResult).toMatchDencoState({
      ...charlotte,
      currentExp: charlotte.currentExp + data.exp, // 解除された全リンクの経験値
      link: [],
    })
    reika = offense.formation[0]
    let reikaResult = getTargetDenco(result.offense)
    expect(reikaResult).toMatchDencoState({
      ...reika,
      currentExp: 68000,
      link: [
        {
          ...charlotte.link[0],
          start: now,
        }
      ]
    })
  })


  test("守備側あり-スキル発動あり-Rebootなし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 30)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    let offense = initUser(context, "とあるマスター１", [
      reika
    ])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [
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
    // 相手の確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // アクセス結果の確認
    expect(result.linkSuccess).toBe(false)
    expect(result.linkDisconnected).toBe(false)
    // リンク
    reika = result.offense.formation[0]
    expect(reika.link.length).toBe(0)
    // アクセス処理の確認
    expect(result.pinkMode).toBe(false)
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.attackPercent).toBe(20)
    expect(result.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(result.damageBase?.variable).toBe(180)
    expect(result.damageFixed).toBe(0)
    // スコア＆経験値
    expect(result.offense.score.access).toBe(accessScore + 180) // アクセス＋ダメージ量
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + 180)
    expect(result.offense.displayedExp).toBe(accessScore + 180)
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.score.skill).toBe(0)
    expect(result.defense?.score.link).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    let d = getAccessDenco(result, "offense")
    expect(d.name).toBe("reika")
    expect(d.hpBefore).toBe(165)
    expect(d.hpAfter).toBe(165)
    expect(d.currentHp).toBe(165)
    expect(d.damage).toBeUndefined()
    expect(d.exp.access).toBe(accessScore + 180)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    expect(result.offense.triggeredSkills.length).toBe(1)
    expect(result.offense.triggeredSkills[0].name).toBe("reika")
    expect(result.offense.triggeredSkills[0].step).toBe("damage_common")
    d = getAccessDenco(result, "defense")
    expect(d.name).toBe("charlotte")
    expect(d.hpBefore).toBe(324)
    expect(d.hpAfter).toBe(144)
    expect(d.currentHp).toBe(144)
    expect(d.link.length).toBe(3)
    expect(d.damage?.value).toBe(180)
    expect(d.damage?.attr).toBe(true)
    expect(d.exp.access).toBe(0)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
  })


  test("守備側あり-スキル確率発動なし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let sheena = DencoManager.getDenco(context, "7", 50, 3)
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
    context.random.mode = "ignore"
    const result = startAccess(context, config)
    expect(result.offense.event.length).toBe(1)
    // 相手の確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // アクセス結果の確認
    expect(result.linkSuccess).toBe(false)
    expect(result.linkDisconnected).toBe(false)
    // アクセス処理の確認
    expect(result.pinkMode).toBe(false)
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(result.damageBase?.variable).toBe(200)
    expect(result.damageFixed).toBe(0)
    expect(result.offense.triggeredSkills.length).toBe(0)
    expect(result.defense?.triggeredSkills.length).toBe(0)
    // スコア＆経験値
    expect(result.offense.score.access).toBe(accessScore + 200) // アクセス＋ダメージ量
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + 200)
    expect(result.offense.displayedExp).toBe(accessScore + 200)
    expect(result.defense?.score.access).toBe(0)
    expect(result.defense?.score.skill).toBe(0)
    expect(result.defense?.score.link).toBe(0)
    expect(result.defense?.displayedScore).toBe(0)
    expect(result.defense?.displayedExp).toBe(0)
    // 被アクセス側詳細
    let d = getAccessDenco(result, "defense")
    expect(d.name).toBe("sheena")
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(64)
    expect(d.currentHp).toBe(64)
    expect(d.damage?.value).toBe(200)
    expect(d.damage?.attr).toBe(false)
  })


  test("守備側あり-カウンター攻撃あり", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let sheena = DencoManager.getDenco(context, "7", 50, 3)
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
    expect(result.offense.event.length).toBe(1)
    // 相手の確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // アクセス結果の確認
    expect(result.linkSuccess).toBe(false)
    expect(result.linkDisconnected).toBe(false)
    // アクセス処理の確認
    expect(result.pinkMode).toBe(false)
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(result.offense.triggeredSkills.length).toBe(0)
    expect(result.defense?.triggeredSkills.length).toBe(1)
    expect(result.defense?.triggeredSkills[0].name).toBe("sheena")
    expect(result.defense?.triggeredSkills[0].step).toBe("after_damage")
    // スコア＆経験値
    expect(result.offense.score.access).toBe(accessScore + 200) // アクセス＋ダメージ量
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.score.link).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + 200)
    expect(result.offense.displayedExp).toBe(accessScore + 200)
    expect(result.defense?.score.access).toBe(160) // 反撃によるダメージ量スコア
    expect(result.defense?.score.skill).toBe(0)
    expect(result.defense?.score.link).toBe(0)
    expect(result.defense?.displayedScore).toBe(160)
    expect(result.defense?.displayedExp).toBe(160)
    // 攻守詳細
    let d = getAccessDenco(result, "defense")
    expect(d.name).toBe("sheena")
    expect(d.hpBefore).toBe(264)
    expect(d.hpAfter).toBe(64)
    expect(d.currentHp).toBe(64)
    expect(d.damage?.value).toBe(200)
    expect(d.damage?.attr).toBe(false)
    expect(d.exp.access).toBe(160)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    d = getAccessDenco(result, "offense")
    expect(d.name).toBe("reika")
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(32)
    expect(d.currentHp).toBe(32)
    expect(d.damage?.value).toBe(160)
    expect(d.damage?.attr).toBe(false)
    expect(d.exp.access).toBe(accessScore + 200)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
  })



  test("守備側あり-カウンター攻撃あり-Rebootあり", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let sheena = DencoManager.getDenco(context, "7", 80, 3)
    reika.nextExp = Number.MAX_SAFE_INTEGER
    sheena.nextExp = Number.MAX_SAFE_INTEGER
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
    expect(result.offense.event.length).toBe(2)
    // 相手の確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // アクセス結果の確認
    expect(result.linkSuccess).toBe(false)
    expect(result.linkDisconnected).toBe(false)
    // アクセス処理の確認
    expect(result.pinkMode).toBe(false)
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // ダメージ計算確認
    expect(result.offense.triggeredSkills.length).toBe(0)
    expect(result.defense?.triggeredSkills.length).toBe(1)
    expect(result.defense?.triggeredSkills[0].name).toBe("sheena")
    expect(result.defense?.triggeredSkills[0].step).toBe("after_damage")
    // スコア＆経験値
    expect(result.offense.score.access).toBe(accessScore + 200) // アクセス＋ダメージ量
    expect(result.offense.score.skill).toBe(0)
    expect(result.offense.displayedScore).toBe(accessScore + 200) // アクセス側のリブートリンクスコアは含まない
    expect(result.offense.displayedExp).toBe(accessScore + 200)
    expect(result.defense?.score.access).toBe(250) // 反撃によるダメージ量スコア
    expect(result.defense?.score.skill).toBe(0)
    expect(result.defense?.displayedScore).toBe(250)
    expect(result.defense?.displayedExp).toBe(250)
    // 攻守詳細
    let d = getAccessDenco(result, "defense")
    expect(d.name).toBe("sheena")
    expect(d.hpBefore).toBe(420)
    expect(d.hpAfter).toBe(220)
    expect(d.currentHp).toBe(220)
    expect(d.damage?.value).toBe(200)
    expect(d.damage?.attr).toBe(false)
    expect(d.exp.access).toBe(250)
    expect(d.exp.skill).toBe(0)
    expect(d.exp.link).toBe(0)
    d = getAccessDenco(result, "offense")
    expect(d.name).toBe("reika")
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.currentHp).toBe(192)
    expect(d.damage?.value).toBe(250)
    expect(d.damage?.attr).toBe(false)
    expect(d.exp.access).toBe(accessScore + 200)
    expect(d.exp.skill).toBe(0)
    expect(d.reboot).toBe(true)
    expect(d.disconnectedLink?.link.length).toBe(1)
    expect(d.disconnectedLink?.link[0]).toMatchObject(reika.link[0])
    expect(d.disconnectedLink?.totalScore).toBe(result.offense?.score?.link)
    expect(d.disconnectedLink?.exp).toBe(d.exp.link)
    expect(d.disconnectedLink?.denco).toMatchDencoState({ ...d, currentExp: 0 }) // 経験値は追加前
    let e = result.offense.event[1]
    expect(e.type).toBe("reboot")
    let reboot = e.data as LinksResult
    expect(reboot.denco.name).toBe("reika")
    expect(reboot.denco.link.length).toBe(0)
    expect(reboot.link.length).toBe(1)
    expect(reboot.link[0]).toMatchObject(reika.link[0])
    expect(reboot).toMatchObject(d.disconnectedLink as any)
    // リンク解除確認
    let reikaResult = result.offense.formation[0]
    expect(reikaResult.link.length).toBe(0)
    expect(reikaResult.currentExp).toBe(accessScore + 200 + reboot.exp) // アクセス＋ダメージ＋リンク
  })


  test("守備側あり-カウンター攻撃あり-Rebootあり-リンクなし", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    let sheena = DencoManager.getDenco(context, "7", 80, 3)
    reika.nextExp = Number.MAX_SAFE_INTEGER
    sheena.nextExp = Number.MAX_SAFE_INTEGER
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
    expect(result.offense.event.length).toBe(2)
    // 相手の確認
    expect(result.defense).not.toBeUndefined()
    expect(result.defense?.event.length).toBe(1)
    // アクセス結果の確認
    expect(result.linkSuccess).toBe(false)
    expect(result.linkDisconnected).toBe(false)
    // アクセス処理の確認
    expect(result.pinkMode).toBe(false)
    expect(result.pinkItemSet).toBe(false)
    expect(result.pinkItemUsed).toBe(false)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)

    // カウンター受けてリブート
    let d = getAccessDenco(result, "offense")
    expect(d.name).toBe("reika")
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.currentHp).toBe(192)
    expect(d.damage?.value).toBe(250)
    expect(d.damage?.attr).toBe(false)
    expect(d.exp.access).toBe(accessScore + 200)
    expect(d.exp.skill).toBe(0)
    expect(d.reboot).toBe(true)
    // リンク解除はなし
    expect(d.disconnectedLink).toBeUndefined()
    // リブートイベントは発生
    let e = result.offense.event[1]
    assert(e.type === "reboot")
    let reboot = e.data
    expect(reboot.denco.name).toBe("reika")
    expect(reboot.denco.link.length).toBe(0)
    expect(reboot.link.length).toBe(0)
    expect(reboot.denco).toMatchDencoState({ ...d, currentExp: 0 })
  })
})