import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import moment from "moment-timezone"
import { activateSkill, disactivateSkill, getSkill, hasSkillTriggered, initContext, initUser, refreshState, startAccess } from "../.."

describe("ふぶのスキル", () => {
  test("setup", async () => {
    await StationManager.load()
    await SkillManager.load()
    await DencoManager.load()
    expect(StationManager.data.length).toBeGreaterThan(0)
    expect(SkillManager.map.size).toBeGreaterThan(0)
    expect(DencoManager.data.size).toBeGreaterThan(0)
  })

  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let fubu = DencoManager.getDenco(context, "14", 50)
    expect(fubu.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [fubu])
    const now = moment().valueOf()
    context.clock = now
    fubu = defense.formation[0]
    expect(fubu.name).toBe("fubu")
    let skill = getSkill(fubu)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    expect(() => disactivateSkill(context, defense, 0)).toThrowError()
    defense = activateSkill(context, defense, 0)
    fubu = defense.formation[0]
    skill = getSkill(fubu)
    expect(skill.state.type).toBe("active")
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.data).not.toBeUndefined()
    if (skill.state.type === "active" && skill.state.transition === "manual" && skill.state.data) {
      let data = skill.state.data
      expect(data.activeTimeout).toBe(now + 1800 * 1000)
      expect(data.cooldownTimeout).toBe(now + 1800 * 1000 + 7200 * 1000)
    }
    expect(() => disactivateSkill(context, defense, 0)).toThrowError()

    // 10分経過
    context.clock = now + 600 * 1000
    defense = refreshState(context, defense)
    fubu = defense.formation[0]
    skill = getSkill(fubu)
    expect(skill.state.type).toBe("active")

    // 30分経過
    context.clock = now + 1800 * 1000
    defense = refreshState(context, defense)
    fubu = defense.formation[0]
    skill = getSkill(fubu)
    expect(skill.state.type).toBe("cooldown")
    expect(skill.state.transition).toBe("manual")
    if (skill.state.type === "cooldown" && skill.state.transition === "manual") {
      let timeout = skill.state.data
      expect(timeout.cooldownTimeout).toBe(now + (1800 + 7200) * 1000)
    }

    // 30分 + 2時間経過
    context.clock = now + (1800 + 7200) * 1000
    defense = refreshState(context, defense)
    fubu = defense.formation[0]
    skill = getSkill(fubu)
    expect(skill.state.type).toBe("idle")
  })
  test("発動なし-非アクティブ", () => {
    const context = initContext("test", "test", false)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [charlotte, fubu])
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
    expect(hasSkillTriggered(result.access.defense, fubu)).toBe(false)
    expect(result.access.defendPercent).toBe(0)
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [charlotte, fubu])
    offense = activateSkill(context, offense, 1)
    fubu = offense.formation[1]
    expect(getSkill(fubu).state.type).toBe("active")
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.offense, fubu)).toBe(false)
    expect(result.access.defendPercent).toBe(0)
  })
  test("発動あり-守備側", () => {
    const context = initContext("test", "test", false)
    let fubu = DencoManager.getDenco(context, "14", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [fubu])
    defense = activateSkill(context, defense, 0)
    fubu = defense.formation[0]
    expect(getSkill(fubu).state.type).toBe("active")
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: fubu.link[0],
    }
    const { access } = startAccess(context, config)
    // 基本的なダメージの確認
    expect(access.defense).not.toBeUndefined()
    expect(hasSkillTriggered(access.defense, fubu)).toBe(true)
    expect(access.defendPercent).toBe(19)
    expect(access.damageBase).toBe(162)
    expect(access.damageRatio).toBe(1.0)
    if (access.defense) {
      // アクセス中の状態の確認
      let accessFubu = access.defense.formation[0]
      expect(accessFubu.damage).not.toBeUndefined()
      expect(accessFubu.damage?.value).toBe(162)
      expect(accessFubu.damage?.attr).toBe(false)
      expect(accessFubu.hpBefore).toBe(228)
      expect(accessFubu.hpAfter).toBe(66)
      expect(accessFubu.reboot).toBe(false)
      expect(accessFubu.accessEXP).toBe(0)
    }
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
  })
  test("発動あり-守備側編成内", () => {
    const context = initContext("test", "test", false)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    fubu = defense.formation[1]
    expect(getSkill(fubu).state.type).toBe("active")
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
    const { access } = startAccess(context, config)
    // 基本的なダメージの確認
    expect(access.defense).not.toBeUndefined()
    expect(hasSkillTriggered(access.defense, fubu)).toBe(true)
    expect(access.defendPercent).toBe(19)
    expect(access.damageBase).toBe(210)
    expect(access.damageRatio).toBe(1.3)
    if (access.defense) {
      // アクセス中の状態の確認
      let accessCharlotte = access.defense.formation[0]
      expect(accessCharlotte.damage).not.toBeUndefined()
      expect(accessCharlotte.damage?.value).toBe(210)
      expect(accessCharlotte.damage?.attr).toBe(true)
      expect(accessCharlotte.hpBefore).toBe(228)
      expect(accessCharlotte.hpAfter).toBe(18)
      expect(accessCharlotte.reboot).toBe(false)
      expect(accessCharlotte.accessEXP).toBe(0)
    }
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
  })
  test("発動あり-確率ブースト", () => {
    const context = initContext("test", "test", false)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター２", [reika])
    let defense = initUser(context, "とあるマスター", [charlotte, fubu, hiiru])
    defense = activateSkill(context, defense, 1)
    defense = activateSkill(context, defense, 2)
    fubu = defense.formation[1]
    hiiru = defense.formation[2]
    expect(getSkill(fubu).state.type).toBe("active")
    expect(getSkill(hiiru).state.type).toBe("active")
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
    expect(hasSkillTriggered(result.access.defense, fubu)).toBe(true)
    expect(hasSkillTriggered(result.access.defense, hiiru)).toBe(false)
    expect(result.access.defendPercent).toBe(19)
  })
})