import { DencoManager, init } from "../.."
import { getAccessDenco, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { getFixedDamageDenco } from "../tool/fake"
import { testManualSkill } from "../tool/skillState"

describe("ほこねのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "26",
    name: "hokone",
    active: 1200,
    cooldown: 7200
  })

  test("発動なし-相手なし", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [hokone])
    offense = activateSkill(context, offense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-非アクティブ", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [hokone])
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
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [hokone])
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
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    const t = getSkillTrigger(result, "offense", hokone)[0]
    expect(t.skillName).toBe("妹愛バースト Lv.4")
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(100)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
    expect(t.denco.carIndex).toBe(0)
    expect(t.denco.who).toBe("offense")
    expect(t.denco).toMatchDenco(hokone)

    expect(result.attackPercent).toBe(42)
    expect(hokone.ap).toBe(210)
    expect(result.damageBase?.variable).toBe(298)
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(298)
  })
  test("発動なし-攻撃編成内", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, hokone])
    offense = activateSkill(context, offense, 1)
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
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-被アクセス", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [hokone])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: hokone.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", hokone)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動あり-ATK増加", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [hokone, reika])
    offense = activateSkill(context, offense, 0, 1)
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
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(true)
    expect(result.attackPercent).toBe(42 + 25)
    expect(hokone.ap).toBe(210)
    expect(result.damageBase?.variable).toBe(Math.floor(210 * 1.67))
  })
  test("発動あり-うらら相手", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let urara = DencoManager.getDenco(context, "25", 50, 1)
    urara.currentHp = urara.currentHp - 10
    let offense = initUser(context, "とあるマスター", [hokone])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [urara])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: urara.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    expect(result.attackPercent).toBe(0)
    expect(hokone.ap).toBe(210)
    // 回復の確認
    const heal = Math.floor(210 * 0.4)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(-heal)
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(-heal)
    expect(d.hpBefore).toBe(d.maxHp - 10)
    expect(d.hpAfter).toBe(d.maxHp)
    expect(d.currentHp).toBe(d.maxHp)
    // ほこね経験値＆スコアの確認
    expect(result.offense.score.access.accessBonus).toBe(100)
    expect(result.offense.score.access.linkBonus).toBe(0)
    expect(result.offense.score.access.damageBonus).toBe(0) // 回復時のスコアは0
    expect(result.offense.score.access.total).toBe(100)
    expect(result.offense.score.total).toBe(100)
    d = getAccessDenco(result, "offense")
    expect(d.exp.access.accessBonus).toBe(100)
    expect(d.exp.access.damageBonus).toBe(1) // 回復時はダメージ量相当の経験値は1
    expect(d.exp.access.linkBonus).toBe(0)
    expect(d.exp.access.total).toBe(101)
    expect(d.exp.total).toBe(101)
  })
  test("発動あり-うらら相手-ATK増加", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let urara = DencoManager.getDenco(context, "25", 50, 1)
    let offense = initUser(context, "とあるマスター", [hokone, reika])
    offense = activateSkill(context, offense, 0, 1)
    let defense = initUser(context, "とあるマスター２", [urara])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: urara.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(true)
    expect(result.attackPercent).toBe(25)
    // 回復の確認
    expect(hokone.ap).toBe(210)
    const heal = Math.floor(Math.floor(210 * 1.25) * 0.4)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(-heal)
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(-heal)
    expect(d.hpAfter).toBe(d.maxHp)
    expect(d.currentHp).toBe(d.maxHp)
    // ほこね経験値＆スコアの確認
    expect(result.offense.score.access.accessBonus).toBe(100)
    expect(result.offense.score.access.linkBonus).toBe(0)
    expect(result.offense.score.access.damageBonus).toBe(0) // 回復時のスコアは0
    expect(result.offense.score.access.total).toBe(100)
    expect(result.offense.score.total).toBe(100)
    d = getAccessDenco(result, "offense")
    expect(d.exp.access.accessBonus).toBe(100)
    expect(d.exp.access.damageBonus).toBe(1) // 回復時はダメージ量相当の経験値は1
    expect(d.exp.access.linkBonus).toBe(0)
    expect(d.exp.access.total).toBe(101)
    expect(d.exp.total).toBe(101)
  })
  test("発動あり-うらら相手-DEF増加", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let urara = DencoManager.getDenco(context, "25", 80, 1)
    urara.currentHp = 10
    let offense = initUser(context, "とあるマスター", [hokone])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [urara, fubu])
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
      station: urara.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(true)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(19)
    // 回復の確認
    expect(hokone.ap).toBe(210)
    const heal = Math.floor(Math.floor(210 * 0.81) * 0.4)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(-heal)
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(-heal)
    expect(d.hpBefore).toBe(10)
    expect(d.hpAfter).toBe(10 + heal)
    expect(d.currentHp).toBe(10 + heal)
    // ほこね経験値＆スコアの確認
    expect(result.offense.score.access.accessBonus).toBe(100)
    expect(result.offense.score.access.linkBonus).toBe(0)
    expect(result.offense.score.access.damageBonus).toBe(0) // 回復時のスコアは0
    expect(result.offense.score.access.total).toBe(100)
    expect(result.offense.score.total).toBe(100)
    d = getAccessDenco(result, "offense")
    expect(d.exp.access.accessBonus).toBe(100)
    expect(d.exp.access.damageBonus).toBe(1) // 回復時はダメージ量相当の経験値は1
    expect(d.exp.access.linkBonus).toBe(0)
    expect(d.exp.access.total).toBe(101)
    expect(d.exp.total).toBe(101)
  })
  test("発動あり-うらら相手-ミオ", () => {
    // ミオの発動有無の確認
    // 現状の実装だと攻撃側のほこねスキルが先に発動してダメージ量が負数になり、ミオ発動条件を満たさなくなる
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let mio = DencoManager.getDenco(context, "36", 50)
    let urara = DencoManager.getDenco(context, "25", 50, 1)
    let offense = initUser(context, "とあるマスター", [hokone])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [urara, mio])
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
      station: urara.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    expect(hasSkillTriggered(result, "defense", mio)).toBe(false)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // 回復の確認
    expect(hokone.ap).toBe(210)
    const heal = Math.floor(210 * 0.4)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(-heal)
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(-heal)
  })
  test("発動あり-うらら相手-固定ダメージ追加", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let test = getFixedDamageDenco(50)
    let urara = DencoManager.getDenco(context, "25", 50, 1)
    let offense = initUser(context, "とあるマスター", [hokone, test])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [urara])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: urara.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    expect(hasSkillTriggered(result, "offense", test)).toBe(true)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // 回復の確認
    expect(hokone.ap).toBe(210)
    expect(result.damageFixed).toBe(50)
    const heal = Math.floor(210 * 0.4)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(-heal)
    // 固定ダメージの増減はATK&DEF増減によるダメージ計算とは別に計算され最後に加算される
    // 結果としてほこねスキルとは無関係に正ダメージ量のまま残り、
    // 回復量を減らす
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(-heal + 50)
    expect(d.hpAfter).toBe(d.maxHp)
    expect(d.currentHp).toBe(d.maxHp)
  })
  test("発動あり-うらら相手-固定ダメージ追加大", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let test = getFixedDamageDenco(100)
    let urara = DencoManager.getDenco(context, "25", 50, 1)
    let offense = initUser(context, "とあるマスター", [hokone, test])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [urara])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: urara.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    expect(hasSkillTriggered(result, "offense", test)).toBe(true)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // 回復の確認
    expect(hokone.ap).toBe(210)
    expect(result.damageFixed).toBe(100)
    const heal = Math.floor(210 * 0.4)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(-heal)
    // 固定ダメージの追加はほこねスキルとは無関係に正ダメージ量のまま残る
    // 回復量を上回る増加量だと結果として正のダメージ量が発生する
    let d = getAccessDenco(result, "defense")
    expect(-heal + 100).toBeGreaterThan(0)
    expect(d.damage?.value).toBe(-heal + 100)
    expect(d.hpBefore).toBe(d.maxHp)
    expect(d.hpAfter).toBe(d.maxHp + heal - 100)
    expect(d.currentHp).toBe(d.maxHp + heal - 100)
  })
  test("発動あり-うらら相手-固定ダメージ増減", () => {
    // 参考：https://ekimemo.com/news/20200313150000_1
    // 固定ダメージの増減両方が効く
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let test1 = getFixedDamageDenco(100)
    let urara = DencoManager.getDenco(context, "25", 50, 1)
    let test2 = getFixedDamageDenco(-80)
    let offense = initUser(context, "とあるマスター", [hokone, test1])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [urara, test2])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: urara.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    expect(hasSkillTriggered(result, "offense", test1)).toBe(true)
    expect(hasSkillTriggered(result, "defense", test2)).toBe(true)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // 回復の確認
    expect(hokone.ap).toBe(210)
    expect(result.damageFixed).toBe(20)
    const heal = Math.floor(210 * 0.4)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(-heal)
    // 固定ダメージの増減はATK&DEF増減によるダメージ計算とは別に計算され最後に加算される
    // 今回は固定ダメージの小計が正数なので回復量を減らす
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(-heal + 20)
    expect(d.hpAfter).toBe(d.maxHp)
    expect(d.currentHp).toBe(d.maxHp)
  })
  test("発動あり-うらら相手-固定ダメージ軽減", () => {
    const context = initContext("test", "test", false)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let urara = DencoManager.getDenco(context, "25", 50, 1)
    let test2 = getFixedDamageDenco(-80)
    let offense = initUser(context, "とあるマスター", [hokone])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [urara, test2])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: urara.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    expect(hasSkillTriggered(result, "defense", test2)).toBe(true)
    expect(result.attackPercent).toBe(0)
    expect(result.defendPercent).toBe(0)
    // 回復の確認
    expect(hokone.ap).toBe(210)
    expect(result.damageFixed).toBe(-80)
    const heal = Math.floor(210 * 0.4)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(-heal)
    // 固定ダメージ増減の小計が負数の場合の挙動
    // 参考：https://ekimemo.com/news/20200313150000_1
    // 固定ダメージの増減両方が効く
    // 固定ダメージの原則に従えば小計が負数でも回復はしない（下限0がある）
    // ほこねスキルによる回復量には影響しない？
    let d = getAccessDenco(result, "defense")
    expect(d.damage?.value).toBe(-heal)
    expect(d.hpAfter).toBe(d.maxHp)
    expect(d.currentHp).toBe(d.maxHp)
  })
})
