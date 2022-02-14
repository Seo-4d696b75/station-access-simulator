import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { initContext } from "../../core/context"
import { initUser, refreshState } from "../../core/user"
import { activateSkill, disactivateSkill, getSkill, SkillActiveTimeout, SkillCooldownTimeout } from "../../core/skill"
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access"
import moment from "moment-timezone"
import { copyDencoState, DencoState } from "../.."

describe("チコのスキル", () => {
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
    let chiko = DencoManager.getDenco(context, "29", 50)
    expect(chiko.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [chiko])
    const now = moment().valueOf()
    context.clock = now
    state = refreshState(context, state)
    chiko = state.formation[0]
    expect(chiko.name).toBe("chiko")
    let skill = getSkill(chiko)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    state = activateSkill(context, state, 0)
    chiko = state.formation[0]
    skill = getSkill(chiko)
    expect(skill.state.type).toBe("active")
    expect(skill.state.data).not.toBeUndefined()
    let data = skill.state.data as SkillActiveTimeout
    expect(data.activeTimeout).toBe(now + 600 * 1000)
    expect(data.cooldownTimeout).toBe(now + 600 * 1000 + 10800 * 1000)

    // 5分経過
    context.clock = now + 300 * 1000
    state = refreshState(context, state)
    chiko = state.formation[0]
    skill = getSkill(chiko)
    expect(skill.state.type).toBe("active")

    // 10分経過
    context.clock = now + 600 * 1000
    state = refreshState(context, state)
    chiko = state.formation[0]
    skill = getSkill(chiko)
    expect(skill.state.type).toBe("cooldown")
    let timeout = skill.state.data as SkillCooldownTimeout
    expect(timeout.cooldownTimeout).toBe(now + (600 + 10800) * 1000)

    // 3時間10分経過
    context.clock = now + (600 + 10800) * 1000
    state = refreshState(context, state)
    chiko = state.formation[0]
    skill = getSkill(chiko)
    expect(skill.state.type).toBe("idle")
  })
  test("発動あり-基本形", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko])
    offense = activateSkill(context, offense, 0)
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
    const access = result.access
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    expect(access.defendPercent).toBe(0)
    expect(access.attackPercent).toBe(0)
    expect(hasSkillTriggered(access.offense, chiko)).toBe(true)
    expect(access.damageBase?.variable).toBe(0)
    expect(access.damageBase?.constant).toBe(192)
    expect(access.damageFixed).toBe(0)
    let d = getAccessDenco(access, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(192)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko])
    offense = activateSkill(context, offense, 0)
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
    const access = result.access
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    expect(access.defendPercent).toBe(0)
    expect(access.attackPercent).toBe(0)
    expect(hasSkillTriggered(access.offense, chiko)).toBe(false)
    expect(access.damageBase?.variable).toBe(253)
    expect(access.damageBase?.constant).toBe(0)
    expect(access.damageFixed).toBe(0)
    let d = getAccessDenco(access, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(253)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動あり-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko, hiiru])
    offense = activateSkill(context, offense, 0, 1)
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
    const access = result.access
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    expect(access.defendPercent).toBe(0)
    expect(access.attackPercent).toBe(0)
    expect(hasSkillTriggered(access.offense, chiko)).toBe(true)
    expect(hasSkillTriggered(access.offense, hiiru)).toBe(true)
    expect(access.damageBase?.variable).toBe(0)
    expect(access.damageBase?.constant).toBe(192)
    expect(access.damageFixed).toBe(0)
    let d = getAccessDenco(access, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(192)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動なし-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko, hiiru])
    offense = activateSkill(context, offense, 0, 1)
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
    const access = result.access
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    expect(access.defendPercent).toBe(0)
    expect(access.attackPercent).toBe(0)
    expect(hasSkillTriggered(access.offense, chiko)).toBe(false)
    expect(hasSkillTriggered(access.offense, hiiru)).toBe(true)
    expect(access.damageBase?.variable).toBe(253)
    expect(access.damageBase?.constant).toBe(0)
    expect(access.damageFixed).toBe(0)
    let d = getAccessDenco(access, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(253)
    expect(d.damage?.attr).toBe(true)
  })
  test("発動あり-固定ダメージ追加", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chiko = DencoManager.getDenco(context, "29", 50)
    let test = copyDencoState(test1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [chiko, test])
    offense = activateSkill(context, offense, 0)
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
    const access = result.access
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    expect(access.defendPercent).toBe(0)
    expect(access.attackPercent).toBe(0)
    expect(hasSkillTriggered(access.offense, chiko)).toBe(true)
    expect(hasSkillTriggered(access.offense, test)).toBe(true)
    expect(access.damageBase?.variable).toBe(0)
    expect(access.damageBase?.constant).toBe(192)
    expect(access.damageFixed).toBe(10)
    let d = getAccessDenco(access, "defense")
    expect(d.reboot).toBe(true)
    expect(d.hpBefore).toBe(192)
    expect(d.hpAfter).toBe(0)
    expect(d.damage?.value).toBe(202)
    expect(d.damage?.attr).toBe(true)
  })
})


/**
 * 固定ダメージ追加スキルのでんこ（ダミー）
 */
 const test1: DencoState = {
  numbering: "test1",
  name: "test1",
  type: "supporter",
  attr: "flat",
  level: 50,
  currentExp: 0,
  nextExp: 100000,
  currentHp: 100,
  maxHp: 100,
  film: {},
  ap: 100,
  link: [],
  skill: {
    type: "possess",
    level: 1,
    name: "test-skill1",
    propertyReader: () => 0,
    state: {
      type: "active",
      transition: "always",
      data: undefined
    },
    canEvaluate: (context, state, step, self) => step === "damage_fixed" && self.which === "offense",
    evaluate: (context, state, step, self) => {
      state.damageFixed += 10
      return state
    } 
  }
}