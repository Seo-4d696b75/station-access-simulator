import { init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { getFixedDamageDenco } from "../fake"
import { testAlwaysSkill } from "../skillState"

describe("いちほのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "18",
    name: "ichiho"
  })

  test("発動あり-基本形", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [ichiho])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: ichiho.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(true)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(199)
    expect(result.damageFixed).toBe(0)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.hpBefore).toBe(200)
    expect(d.hpAfter).toBe(1)
    expect(d.damage?.value).toBe(199)
    expect(d.damage?.attr).toBe(true)
    expect(result.defense).not.toBeUndefined()
    if (result.defense) {
      ichiho = result.defense.formation[0]
      expect(ichiho.currentHp).toBe(1)
      expect(ichiho.link.length).toBe(1)
    }
  })
  test("発動あり-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [ichiho, hiiru])
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
      station: ichiho.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(true)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(199)
    expect(result.damageFixed).toBe(0)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.hpBefore).toBe(200)
    expect(d.hpAfter).toBe(1)
    expect(d.damage?.value).toBe(199)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [ichiho, hiiru])
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
      station: ichiho.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(false)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    expect(result.damageBase?.variable).toBe(260)
    expect(result.damageBase?.constant).toBe(0)
  })
  test("発動なし-確率-補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [ichiho])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: ichiho.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(false)
    expect(result.damageBase?.variable).toBe(260)
    expect(result.damageBase?.constant).toBe(0)
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let ichiho = DencoManager.getDenco(context, "18", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [ichiho])
    let defense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.offense, ichiho)).toBe(false)
  })
  test("発動なし-守備側編成内", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let ichiho = DencoManager.getDenco(context, "18", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [ichiho, hiiru])
    defense = activateSkill(context, defense, 1)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: hiiru.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(false)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(false)
  })
  test("発動あり-攻撃側-シーナ反撃", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let ichiho = DencoManager.getDenco(context, "18", 50)
    let sheena = DencoManager.getDenco(context, "7", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [ichiho])
    let defense = initUser(context, "とあるマスター２", [sheena, reika])
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
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    // いちほ -> シーナへのダメージ計算詳細
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(result.damageBase?.variable).toBe(190)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
    // 発動スキル（カウンターも含む)
    expect(hasSkillTriggered(result.offense, ichiho)).toBe(true)
    expect(hasSkillTriggered(result.defense, sheena)).toBe(true)
    expect(hasSkillTriggered(result.defense, reika)).toBe(true)
    let accessSheena = getAccessDenco(result, "defense")
    expect(accessSheena.reboot).toBe(false)
    expect(accessSheena.hpBefore).toBe(264)
    expect(accessSheena.hpAfter).toBe(74)
    expect(accessSheena.damage?.value).toBe(190)
    expect(accessSheena.damage?.attr).toBe(false)
    // カウンター攻撃で発生したダメージ
    let accessIchiho = getAccessDenco(result, "offense")
    expect(accessIchiho.reboot).toBe(false)
    expect(accessIchiho.hpBefore).toBe(200)
    expect(accessIchiho.hpAfter).toBe(1)
    expect(accessIchiho.damage?.value).toBe(199)
    expect(accessIchiho.damage?.attr).toBe(true)
  })
  test("発動あり-ちこ", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let chiko = DencoManager.getDenco(context, "29", 50)
    let offense = initUser(context, "とあるマスター", [chiko])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [ichiho])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: ichiho.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.offense, chiko)).toBe(true)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(true)
    /* `damage_special` の同一段階で発動スキルどうしの場合は
      守備側のいちほが後に評価されたダメージ量を上書きする
    */
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(199)
    expect(result.damageFixed).toBe(0)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.hpBefore).toBe(200)
    expect(d.hpAfter).toBe(1)
    expect(d.damage?.value).toBe(199)
    expect(d.damage?.attr).toBe(false)
  })
  test("発動あり-固定ダメージ追加", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let test = getFixedDamageDenco(10)
    let offense = initUser(context, "とあるマスター", [reika, test])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [ichiho])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: ichiho.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(25)
    expect(hasSkillTriggered(result.offense, reika)).toBe(true)
    expect(hasSkillTriggered(result.offense, test)).toBe(true)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(true)
    // 固定ダメージで貫通
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(199)
    expect(result.damageFixed).toBe(10)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(200)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(209)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動あり-ちこ-固定ダメージ追加", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let chiko = DencoManager.getDenco(context, "29", 50)
    let test = getFixedDamageDenco(10)
    let offense = initUser(context, "とあるマスター", [chiko, test])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [ichiho])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: ichiho.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.offense, chiko)).toBe(true)
    expect(hasSkillTriggered(result.offense, test)).toBe(true)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(true)
    // 固定ダメージで貫通
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(199)
    expect(result.damageFixed).toBe(10)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(200)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(209)
    expect(d.damage?.attr).toBe(false)
  })
  test("発動あり-固定ダメージ軽減", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let test = getFixedDamageDenco(-20)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [ichiho, test])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: ichiho.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(true)
    expect(hasSkillTriggered(result.defense, test)).toBe(true)
    // 固定ダメージ軽減は damageBase.constant には効かない
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(199)
    expect(result.damageFixed).toBe(-20)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.hpBefore).toBe(200)
    expect(d.hpAfter).toBe(1)
    expect(d.damage?.value).toBe(199)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動あり-固定ダメージ軽減＆追加", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let cut = getFixedDamageDenco(-20)
    let reika = DencoManager.getDenco(context, "5", 50)
    let add = getFixedDamageDenco(10)
    let offense = initUser(context, "とあるマスター", [reika, add])
    let defense = initUser(context, "とあるマスター２", [ichiho, cut])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: ichiho.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(true)
    expect(hasSkillTriggered(result.defense, cut)).toBe(true)
    expect(hasSkillTriggered(result.offense, add)).toBe(true)
    // 固定ダメージ増減は damageBase.variable にのみ作用して負数は0に固定
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(199)
    expect(result.damageFixed).toBe(-10)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.hpBefore).toBe(200)
    expect(d.hpAfter).toBe(1)
    expect(d.damage?.value).toBe(199)
    expect(d.damage?.attr).toBe(true)
  })
})
