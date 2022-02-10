import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import moment from "moment-timezone"
import { activateSkill, disactivateSkill, getSkill, initContext, initUser, startAccess } from "../.."

describe("しいらのスキル", () => {
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
    let siira = DencoManager.getDenco(context, "11", 50)
    let state = initUser(context, "master", [siira])
    siira = state.formation[0]
    expect(siira.name).toBe("siira")
    expect(siira.skillHolder.type).toBe("possess")
    let skill = getSkill(siira)
    expect(skill.transitionType).toBe("always")
    expect(skill.state.type).toBe("active")
    expect(() => activateSkill(context, { ...state, carIndex: 0 })).toThrowError()
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 })).toThrowError()
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    let siira = DencoManager.getDenco(context, "11", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let offense = initUser(context, "とあるマスター", [siira])
    let defense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: reika.link[0],
    }
    const { access } = startAccess(context, config)
    expect(access.offense.triggeredSkills.length).toBe(0)
  })
  test("発動なし-自身以外が被アクセス", () => {
    const context = initContext("test", "test", false)
    let siira = DencoManager.getDenco(context, "11", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [charlotte, siira])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: charlotte.link[0],
    }
    const { access } = startAccess(context, config)
    expect(access.defense).not.toBeUndefined()
    if (access.defense) {
      expect(access.defense.triggeredSkills.length).toBe(0)
    }
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [charlotte, siira])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 1,
        ...defense
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    // 基本的なダメージの確認
    expect(access.defense).not.toBeUndefined()
    expect(access.defense?.triggeredSkills.length).toBe(0)
    expect(access.defendPercent).toBe(0)
    expect(access.damageBase).toBe(260)
    expect(access.damageRatio).toBe(1.3)
    if (access.defense) {
      // アクセス中の状態の確認
      let accessSiira = access.defense.formation[1]
      expect(accessSiira.damage).not.toBeUndefined()
      expect(accessSiira.damage?.value).toBe(260)
      expect(accessSiira.damage?.attr).toBe(true)
      expect(accessSiira.hpBefore).toBe(252)
      expect(accessSiira.hpAfter).toBe(0)
      expect(accessSiira.reboot).toBe(true)
      expect(accessSiira.accessEXP).toBe(0)
    }
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
    if (result.defense) {
      // リブート確認
      defense = result.defense
      siira = defense.formation[1]
      expect(siira.currentHp).toBe(252)
      expect(defense.event.length).toBe(2)
      let event = defense.event[1]
      expect(event.type).toBe("reboot")
      if (event.type === "reboot") {
        expect(siira.currentExp).toBe(0 + event.data.exp)
      }
    }
  })
  test("発動なし-確率-ひいる補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [hiiru, siira])
    defense = activateSkill(context, {...defense, carIndex: 0})
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 1,
        ...defense
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    // 基本的なダメージの確認
    expect(access.defense).not.toBeUndefined()
    expect(access.defendPercent).toBe(0)
    expect(access.damageBase).toBe(260)
    expect(access.damageRatio).toBe(1.3)
    if (access.defense) {
      // 確率補正の確認
      expect(access.defense.triggeredSkills.length).toBe(1)
      let tirgger = access.defense.triggeredSkills[0]
      expect(tirgger.name).toBe(hiiru.name)
      expect(tirgger.step).toBe("probability_check")
    }
    expect(access.linkDisconncted).toBe(true)
    expect(access.linkSuccess).toBe(true)
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [charlotte, siira])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 1,
        ...defense
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    // 基本的なダメージの確認
    expect(access.defense).not.toBeUndefined()
    expect(access.defendPercent).toBe(25)
    expect(access.damageBase).toBe(195)
    expect(access.damageRatio).toBe(1.3)
    if (access.defense) {
      // アクセス中の状態の確認
      expect(access.defense.triggeredSkills.length).toBe(1)
      let tirgger = access.defense.triggeredSkills[0]
      expect(tirgger.name).toBe(siira.name)
      expect(tirgger.step).toBe("damage_common")
      let accessSiira = access.defense.formation[1]
      expect(accessSiira.damage).not.toBeUndefined()
      expect(accessSiira.damage?.value).toBe(195)
      expect(accessSiira.damage?.attr).toBe(true)
      expect(accessSiira.hpBefore).toBe(252)
      expect(accessSiira.hpAfter).toBe(57)
      expect(accessSiira.reboot).toBe(false)
      expect(accessSiira.accessEXP).toBe(0)
    }
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
  })
  test("発動あり-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [hiiru, siira])
    defense = activateSkill(context, {...defense, carIndex: 0})
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 1,
        ...defense
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    const access = result.access
    // 基本的なダメージの確認
    expect(access.defense).not.toBeUndefined()
    expect(access.defendPercent).toBe(25)
    expect(access.damageBase).toBe(195)
    expect(access.damageRatio).toBe(1.3)
    if (access.defense) {
      // アクセス中の状態の確認
      expect(access.defense.triggeredSkills.length).toBe(2)
      let tirgger = access.defense.triggeredSkills[0]
      expect(tirgger.name).toBe(hiiru.name)
      expect(tirgger.step).toBe("probability_check")
      tirgger = access.defense.triggeredSkills[1]
      expect(tirgger.name).toBe(siira.name)
      expect(tirgger.step).toBe("damage_common")
    }
    expect(access.linkDisconncted).toBe(false)
    expect(access.linkSuccess).toBe(false)
  })
})