import moment from "moment-timezone"
import { copyDencoState, DencoState, getDefense, init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, getSkill, SkillActiveTimeout, SkillCooldownTimeout } from "../../core/skill"
import { initUser, refreshState } from "../../core/user"
import { getFixedDamageDenco } from "../util"

describe("ミオのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let mio = DencoManager.getDenco(context, "36", 50)
    expect(mio.skill.type).toBe("possess")
    expect(mio.name).toBe("mio")
    let state = initUser(context, "とあるマスター", [mio])
    const now = moment().valueOf()
    context.clock = now
    state = refreshState(context, state)
    mio = state.formation[0]
    expect(mio.name).toBe("mio")
    let skill = getSkill(mio)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    state = activateSkill(context, state, 0)
    mio = state.formation[0]
    skill = getSkill(mio)
    expect(skill.state.type).toBe("active")
    expect(skill.state.data).not.toBeUndefined()
    let data = skill.state.data as SkillActiveTimeout
    expect(data.activeTimeout).toBe(now + 1800 * 1000)
    expect(data.cooldownTimeout).toBe(now + 1800 * 1000 + 10800 * 1000)

    // 5分経過
    context.clock = now + 300 * 1000
    state = refreshState(context, state)
    mio = state.formation[0]
    skill = getSkill(mio)
    expect(skill.state.type).toBe("active")

    // 30分経過
    context.clock = now + 1800 * 1000
    state = refreshState(context, state)
    mio = state.formation[0]
    skill = getSkill(mio)
    expect(skill.state.type).toBe("cooldown")
    let timeout = skill.state.data as SkillCooldownTimeout
    expect(timeout.cooldownTimeout).toBe(now + (1800 + 10800) * 1000)

    // 3時間30分経過
    context.clock = now + (1800 + 10800) * 1000
    state = refreshState(context, state)
    mio = state.formation[0]
    skill = getSkill(mio)
    expect(skill.state.type).toBe("idle")
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 50)
    let offense = initUser(context, "とあるマスター", [chiko])
    let defense = initUser(context, "とあるマスター２", [reika, mio])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, mio)).toBe(false)
    expect(result.damageBase?.variable).toBe(253)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 50)
    let offense = initUser(context, "とあるマスター", [chiko, mio])
    let defense = initUser(context, "とあるマスター２", [reika])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.offense, mio)).toBe(false)
    expect(result.damageBase?.variable).toBe(253)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
  })
  test("発動なし-守備側被アクセス", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko])
    let defense = initUser(context, "とあるマスター２", [reika, mio])
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
      station: mio.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, mio)).toBe(false)
    expect(result.damageBase?.variable).toBe(195)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
  })
  test("発動あり-damage<HP", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 80)
    let offense = initUser(context, "とあるマスター", [chiko])
    let defense = initUser(context, "とあるマスター２", [reika, mio])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, mio)).toBe(true)
    expect(result.damageBase?.variable).toBe(1)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
    let accessReika = getAccessDenco(result, "defense")
    expect(accessReika.damage).not.toBeUndefined()
    expect(accessReika.damage?.value).toBe(1)
    expect(accessReika.damage?.attr).toBe(true)
    let accessMio = getDefense(result).formation[1]
    expect(accessMio.hpBefore).toBe(294)
    expect(accessMio.hpAfter).toBe(99)

    expect(result.defense).not.toBeUndefined()
    if (result.defense) {
      mio = result.defense.formation[1]
      expect(mio.currentHp).toBe(99)
    }
  })
  test("発動あり-damage>HP", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 50)
    let offense = initUser(context, "とあるマスター", [chiko])
    let defense = initUser(context, "とあるマスター２", [reika, mio])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, mio)).toBe(true)
    expect(result.damageBase?.variable).toBe(16)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
    let accessReika = getAccessDenco(result, "defense")
    expect(accessReika.damage).not.toBeUndefined()
    expect(accessReika.damage?.value).toBe(16)
    expect(accessReika.damage?.attr).toBe(true)
    let accessMio = getDefense(result).formation[1]
    expect(accessMio.hpBefore).toBe(183)
    expect(accessMio.hpAfter).toBe(1)

    expect(result.defense).not.toBeUndefined()
    if (result.defense) {
      mio = result.defense.formation[1]
      expect(mio.currentHp).toBe(1)
    }
  })
  test("発動あり-ATK", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let reika = DencoManager.getDenco(context, "5", 50)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 80)
    let offense = initUser(context, "とあるマスター", [reika])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [miroku, mio])
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
      station: miroku.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(25)
    expect(hasSkillTriggered(result.offense, reika)).toBe(true)
    expect(hasSkillTriggered(result.defense, mio)).toBe(true)
    expect(result.damageBase?.variable).toBe(1)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
    let accessMiroku = getAccessDenco(result, "defense")
    expect(accessMiroku.damage).not.toBeUndefined()
    expect(accessMiroku.damage?.value).toBe(1)
    expect(accessMiroku.damage?.attr).toBe(false)
    let accessMio = getDefense(result).formation[1]
    // ミオ肩代わりのダメージ量にはATK影響あり
    expect(accessMio.hpBefore).toBe(294)
    expect(accessMio.hpAfter).toBe(44)
  })
  test("発動あり-ATK", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let reika = DencoManager.getDenco(context, "5", 80)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 50)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [miroku, mio, fubu])
    defense = activateSkill(context, defense, 1, 2)
    const config = {
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
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(19)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(true)
    expect(hasSkillTriggered(result.defense, mio)).toBe(true)
    expect(result.damageBase?.variable).toBe(63)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
    let accessMiroku = getAccessDenco(result, "defense")
    expect(accessMiroku.damage).not.toBeUndefined()
    expect(accessMiroku.damage?.value).toBe(63)
    expect(accessMiroku.damage?.attr).toBe(false)
    let accessMio = getDefense(result).formation[1]
    // ミオ肩代わりのダメージ量にはDEF影響なし
    expect(accessMio.hpBefore).toBe(183)
    expect(accessMio.hpAfter).toBe(1)
  })
  test("発動あり-ATK&DEF", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let reika = DencoManager.getDenco(context, "5", 80)
    let miroku = DencoManager.getDenco(context, "4", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 50)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [miroku, mio, fubu])
    defense = activateSkill(context, defense, 1, 2)
    const config = {
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
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(19)
    expect(result.attackPercent).toBe(45)
    expect(hasSkillTriggered(result.offense, reika)).toBe(true)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(true)
    expect(hasSkillTriggered(result.defense, mio)).toBe(true)
    expect(result.damageBase?.variable).toBe(157)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(0)
    let accessMiroku = getAccessDenco(result, "defense")
    expect(accessMiroku.damage).not.toBeUndefined()
    expect(accessMiroku.damage?.value).toBe(157)
    expect(accessMiroku.damage?.attr).toBe(false)
    let accessMio = getDefense(result).formation[1]
    expect(accessMio.hpBefore).toBe(183)
    expect(accessMio.hpAfter).toBe(1)
  })
  test("発動あり-固定ダメージ軽減", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 80)
    let d = getFixedDamageDenco(-20)
    let offense = initUser(context, "とあるマスター", [chiko])
    let defense = initUser(context, "とあるマスター２", [reika, mio, d])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, mio)).toBe(true)
    expect(hasSkillTriggered(result.defense, d)).toBe(true)
    expect(result.damageBase?.variable).toBe(1)
    expect(result.damageBase?.constant).toBe(0)
    expect(result.damageFixed).toBe(-20)
    let accessReika = getAccessDenco(result, "defense")
    expect(accessReika.damage).not.toBeUndefined()
    expect(accessReika.damage?.value).toBe(0)
    expect(accessReika.damage?.attr).toBe(true)
    let accessMio = getDefense(result).formation[1]
    expect(accessMio.hpBefore).toBe(294)
    expect(accessMio.hpAfter).toBe(99)
  })
  test("発動なし-チコ", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 80)
    let offense = initUser(context, "とあるマスター", [chiko])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [reika, mio])
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
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(true)
    expect(result.linkSuccess).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    expect(hasSkillTriggered(result.defense, mio)).toBe(false)
    expect(hasSkillTriggered(result.offense, chiko)).toBe(true)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(192)
    expect(result.damageFixed).toBe(0)
    let accessReika = getAccessDenco(result, "defense")
    expect(accessReika.damage).not.toBeUndefined()
    expect(accessReika.hpBefore).toBe(192)
    expect(accessReika.damage?.value).toBe(192)
    expect(accessReika.damage?.attr).toBe(true)
  })
  test("発動なし-いちほ", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 80)
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 80)
    let offense = initUser(context, "とあるマスター", [chiko])
    let defense = initUser(context, "とあるマスター２", [ichiho, mio])
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
    // 編成位置よりいちほスキルが先に発動してダメージ量を決定する ミオが肩代わりするダメージ量は0
    expect(hasSkillTriggered(result.defense, mio)).toBe(false)
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(true)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(199)
    expect(result.damageFixed).toBe(0)
    let accessIchiho = getAccessDenco(result, "defense")
    expect(accessIchiho.damage).not.toBeUndefined()
    expect(accessIchiho.damage?.value).toBe(199)
    expect(accessIchiho.damage?.attr).toBe(false)
  })
  test("発動あり-いちほ", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 80)
    let reika = DencoManager.getDenco(context, "5", 80)
    let ichiho = DencoManager.getDenco(context, "18", 50, 1)
    let mio = DencoManager.getDenco(context, "36", 50)
    let offense = initUser(context, "とあるマスター", [chiko, reika])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [mio, ichiho])
    defense = activateSkill(context, defense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: ichiho.link[0],
    }
    const result = startAccess(context, config)
    expect(result.linkDisconnected).toBe(false)
    expect(result.linkSuccess).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(45)
    // 編成位置よりミオのスキルが先に発動してダメージ量を肩代わり
    expect(hasSkillTriggered(result.defense, mio)).toBe(true)
    // しかし貫通したダメージ量が大きいと、いちほスキルが発動できる
    expect(hasSkillTriggered(result.defense, ichiho)).toBe(true)
    expect(hasSkillTriggered(result.offense, reika)).toBe(true)
    expect(result.damageBase?.variable).toBe(0)
    expect(result.damageBase?.constant).toBe(199)
    expect(result.damageFixed).toBe(0)
    let accessIchiho = getAccessDenco(result, "defense")
    expect(accessIchiho.damage).not.toBeUndefined()
    expect(accessIchiho.damage?.value).toBe(199)
    expect(accessIchiho.damage?.attr).toBe(false)
    let accessMio = getDefense(result).formation[0]
    expect(accessMio.hpBefore).toBe(183)
    expect(accessMio.hpAfter).toBe(1)
  })
})
