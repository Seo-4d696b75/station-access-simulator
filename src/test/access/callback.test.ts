import { Context, DencoState, init } from "../.."
import { AccessConfig, getAccessDenco, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { TypedMap } from "../../core/property"
import { Skill } from "../../core/skill"
import StationManager from "../../core/stationManager"
import { initUser } from "../../core/user"
import "../tool/matcher"


describe("アクセス処理中のSkillコールバック", () => {

  const initSkill = (): Skill => {
    return {
      type: "possess",
      transitionType: "always", // スキル状態遷移はテスト対象外なので一番単純なalwaysのみ
      level: 1,
      name: "test-skill",
      transition: {
        state: "active", // activeでしかコールバックされない！
        data: undefined
      },
      property: new TypedMap(),
      data: new TypedMap(),
    }
  }

  const initDenco = (context: Context, skill: Skill, link: number = 3): DencoState => {
    return {
      level: 5,
      name: "denco",
      numbering: "5", // DencoLevelStatusが取得できるよう便宜的に指定
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: StationManager.getRandomLink(context, link),
      film: { type: "none" },
      type: "supporter",
      attr: "flat",
      skill: skill
    }
  }

  beforeAll(init)

  test("onAccessComplete", () => {
    const context = initContext("test", "test", false)

    const onAccessComplete = jest.fn((_, state, self, access) => undefined)

    const skill = initSkill()
    skill.onAccessComplete = onAccessComplete

    let denco = initDenco(context, skill)
    let defense = initUser(context, "test-user", [denco])
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.ap = 1000
    let offense = initUser(context, "test-user2", [reika])
    const config: AccessConfig = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: denco.link[0],
    }
    const result = startAccess(context, config)

    // verify
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(true)
    expect(onAccessComplete.mock.calls.length).toBe(1)
    expect(onAccessComplete.mock.calls[0][2]).toMatchDencoState(d)
  })

  describe("onDencoReboot", () => {

    test("リブートあり", () => {
      const context = initContext("test", "test", false)
      const onDencoReboot = jest.fn((_, state, self) => undefined)

      const skill = initSkill()
      skill.onDencoReboot = onDencoReboot

      let denco = initDenco(context, skill)
      let defense = initUser(context, "test-user", [denco])
      let reika = DencoManager.getDenco(context, "5", 50)
      reika.ap = 1000
      let offense = initUser(context, "test-user2", [reika])
      const config: AccessConfig = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: denco.link[0],
      }
      const result = startAccess(context, config)

      // verify
      let d = getAccessDenco(result, "defense")
      expect(d.reboot).toBe(true)
      expect(onDencoReboot.mock.calls.length).toBe(1)
      expect(onDencoReboot.mock.calls[0][2]).toMatchDencoState(d)
    })

    test("リブートなし", () => {
      const context = initContext("test", "test", false)
      const onDencoReboot = jest.fn((_, state, self) => undefined)

      const skill = initSkill()
      skill.onDencoReboot = onDencoReboot

      let denco = initDenco(context, skill)
      let defense = initUser(context, "test-user", [denco])
      let reika = DencoManager.getDenco(context, "5", 50)
      reika.ap = 10
      let offense = initUser(context, "test-user2", [reika])
      const config: AccessConfig = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: denco.link[0],
      }
      const result = startAccess(context, config)

      // verify
      let d = getAccessDenco(result, "defense")
      expect(d.reboot).toBe(false)
      expect(onDencoReboot.mock.calls.length).toBe(0)
    })
  })

  describe("onLinkDisconnected", () => {

    test("リブート", () => {
      const context = initContext("test", "test", false)
      const onLinkDisconnected1 = jest.fn((_, state, self, d) => undefined)
      const onLinkDisconnected2 = jest.fn((_, state, self, d) => undefined)

      const skill1 = initSkill()
      skill1.onLinkDisconnected = onLinkDisconnected1
      let denco1 = initDenco(context, skill1)

      const skill2 = initSkill()
      skill2.onLinkDisconnected = onLinkDisconnected2
      let denco2 = initDenco(context, skill2)

      let defense = initUser(context, "test-user", [denco1, denco2])
      let reika = DencoManager.getDenco(context, "5", 50)
      reika.ap = 1000
      let offense = initUser(context, "test-user2", [reika])
      const config: AccessConfig = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: denco1.link[0],
      }
      const result = startAccess(context, config)
      // verify
      let d1 = result.defense!.formation[0]
      let d2 = result.defense!.formation[1]
      expect(d1.reboot).toBe(true)
      expect(d1.disconnectedLink).not.toBeUndefined()
      expect(d1.disconnectedLink?.link?.length).toBe(3)
      expect(d1.disconnectedLink?.denco).toMatchDencoState(
        { ...denco1, link: [] } // レベルアップ前
      )
      expect(d2.reboot).toBe(false)
      expect(d2.disconnectedLink).toBeUndefined()
      expect(onLinkDisconnected1.mock.calls.length).toBe(1)
      expect(onLinkDisconnected1.mock.calls[0][2]).toMatchDencoState(d1)
      expect(onLinkDisconnected1.mock.calls[0][3]).toMatchObject(d1.disconnectedLink!)
      expect(onLinkDisconnected2.mock.calls.length).toBe(1)
      expect(onLinkDisconnected2.mock.calls[0][2]).toMatchDencoState(d2)
      expect(onLinkDisconnected2.mock.calls[0][3]).toMatchObject(d1.disconnectedLink!)
    })
    test("フットバース（リブートなし）", () => {
      const context = initContext("test", "test", false)
      const onLinkDisconnected1 = jest.fn((_, state, self, d) => undefined)
      const onLinkDisconnected2 = jest.fn((_, state, self, d) => undefined)

      const skill1 = initSkill()
      skill1.onLinkDisconnected = onLinkDisconnected1
      let denco1 = initDenco(context, skill1)

      const skill2 = initSkill()
      skill2.onLinkDisconnected = onLinkDisconnected2
      let denco2 = initDenco(context, skill2)

      let defense = initUser(context, "test-user", [denco1, denco2])
      let reika = DencoManager.getDenco(context, "5", 50)
      reika.ap = 1000
      let offense = initUser(context, "test-user2", [reika])
      const config: AccessConfig = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: denco1.link[0],
        usePink: true,
      }
      const result = startAccess(context, config)
      // verify
      let d1 = result.defense!.formation[0]
      let d2 = result.defense!.formation[1]
      expect(d1.reboot).toBe(false)
      expect(d1.disconnectedLink).not.toBeUndefined()
      expect(d1.disconnectedLink?.link?.length).toBe(1)
      expect(d1.disconnectedLink?.denco).toMatchDencoState(
        { ...denco1, link: denco1.link.slice(1) } // 単一リンクのみ解除
      )
      expect(d2.reboot).toBe(false)
      expect(d2.disconnectedLink).toBeUndefined()
      expect(onLinkDisconnected1.mock.calls.length).toBe(1)
      expect(onLinkDisconnected1.mock.calls[0][2]).toMatchDencoState(d1)
      expect(onLinkDisconnected1.mock.calls[0][3]).toMatchObject(d1.disconnectedLink!)
      expect(onLinkDisconnected2.mock.calls.length).toBe(1)
      expect(onLinkDisconnected2.mock.calls[0][2]).toMatchDencoState(d2)
      expect(onLinkDisconnected2.mock.calls[0][3]).toMatchObject(d1.disconnectedLink!)
    })
    test("カウンター受けてリブート", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      const onLinkDisconnected1 = jest.fn((_, state, self, d) => undefined)
      const onLinkDisconnected2 = jest.fn((_, state, self, d) => undefined)

      const skill1 = initSkill()
      skill1.onLinkDisconnected = onLinkDisconnected1
      let denco1 = initDenco(context, skill1)

      const skill2 = initSkill()
      skill2.onLinkDisconnected = onLinkDisconnected2
      let denco2 = initDenco(context, skill2)

      let offense = initUser(context, "test-user", [denco1, denco2])
      let sheena = DencoManager.getDenco(context, "7", 80, 1)
      sheena.ap = 1000
      let defense = initUser(context, "test-user2", [sheena])
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
      const result = startAccess(context, config)
      // verify
      let d1 = result.offense.formation[0]
      let d2 = result.offense.formation[1]
      expect(d1.reboot).toBe(true)
      expect(d1.disconnectedLink).not.toBeUndefined()
      expect(d1.disconnectedLink?.link?.length).toBe(3)
      expect(d1.disconnectedLink?.denco).toMatchDencoState(
        { ...denco1, link: [] } // リンク解除済み
      )
      expect(d2.reboot).toBe(false)
      expect(d2.disconnectedLink).toBeUndefined()
      expect(onLinkDisconnected1.mock.calls.length).toBe(1)
      expect(onLinkDisconnected1.mock.calls[0][2]).toMatchDencoState(d1)
      expect(onLinkDisconnected1.mock.calls[0][3]).toMatchObject(d1.disconnectedLink!)
      expect(onLinkDisconnected2.mock.calls.length).toBe(1)
      expect(onLinkDisconnected2.mock.calls[0][2]).toMatchDencoState(d2)
      expect(onLinkDisconnected2.mock.calls[0][3]).toMatchObject(d1.disconnectedLink!)
    })
    test("カウンター受けてリブート-リンク解除なし", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      const onLinkDisconnected1 = jest.fn((_, state, self, d) => undefined)
      const onLinkDisconnected2 = jest.fn((_, state, self, d) => undefined)

      const skill1 = initSkill()
      skill1.onLinkDisconnected = onLinkDisconnected1
      let denco1 = initDenco(context, skill1, 0)

      const skill2 = initSkill()
      skill2.onLinkDisconnected = onLinkDisconnected2
      let denco2 = initDenco(context, skill2, 0)

      let offense = initUser(context, "test-user", [denco1, denco2])
      let sheena = DencoManager.getDenco(context, "7", 80, 1)
      sheena.ap = 1000
      let defense = initUser(context, "test-user2", [sheena])
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
      const result = startAccess(context, config)
      // verify
      let d1 = result.offense.formation[0]
      let d2 = result.offense.formation[1]
      expect(d1.reboot).toBe(true)
      expect(d1.disconnectedLink).toBeUndefined()
      expect(d2.reboot).toBe(false)
      expect(d2.disconnectedLink).toBeUndefined()
      expect(onLinkDisconnected1.mock.calls.length).toBe(0)
      expect(onLinkDisconnected2.mock.calls.length).toBe(0)
    })
  })
})