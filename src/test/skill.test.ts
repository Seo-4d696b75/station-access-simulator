import { initContext } from ".."
import { DencoState } from "../core/denco"
import { TypedMap } from "../core/property"
import { activateSkill, deactivateSkill, getSkill, Skill, SkillDeactivateStrategy, SkillLogic } from "../core/skill"
import { initUser, refreshState } from "../core/user"
import "../gen/matcher"


describe("スキル状態遷移・コールバック", () => {
  const dencoBase: DencoState = {
    level: 5,
    name: "denco",
    fullName: "でんこ",
    firstName: "でんこ",
    numbering: "test",
    currentExp: 0,
    nextExp: 100,
    currentHp: 50,
    maxHp: 50,
    ap: 10,
    link: [],
    film: { type: "none" },
    type: "supporter",
    attr: "flat",
    skill: { type: "none" }
  }

  test("activateSkillでカスタムデータを初期化", () => {
    // とりあえずmanual型だけでテスト
    const context = initContext("test", "test", false)

    let denco: DencoState = {
      ...dencoBase,
      skill: {
        type: "possess",
        transitionType: "manual",
        deactivate: "self_deactivate",
        level: 1,
        name: "test-skill",
        transition: {
          state: "not_init",
          data: undefined
        },
        property: new TypedMap(),
        data: new TypedMap(),
      }
    }
    let s = getSkill(denco)
    s.data.putBoolean("key1", true)
    s.data.putString("key2", "string")
    s.data.putNumber("key3", 1)

    const state = initUser(context, "test-user", [denco])
    const next = activateSkill(context, state, 0)

    s = getSkill(state.formation[0])
    expect(s.data.readBoolean("key1")).toBe(true)
    expect(s.data.readString("key2")).toBe("string")
    expect(s.data.readNumber("key3")).toBe(1)
    s = getSkill(next.formation[0])
    expect(() => s.data.readBoolean("key1")).toThrowError()
    expect(() => s.data.readString("key2")).toThrowError()
    expect(() => s.data.readNumber("key3")).toThrowError()

  })

  /*
  auto, manualは別タイプだが空き状態のライフサイクルはほぼ同じ
  異なる点は、
  - activeとcooldownの間の状態がidle,unableと違う
  - activateSkillをユーザ操作・スキル自身の制御どちらが呼び出すか
  */
  describe.each<"auto" | "manual">(["auto", "manual"])("%s", (transitionType) => {

    const idleState = transitionType === "manual" ? "idle" : "unable"

    const onActivated = jest.fn((_, state, self) => state)
    const onCooldown = jest.fn((_, state, self) => state)
    const init = (deactivate: SkillDeactivateStrategy, property: undefined | [string, any][]): DencoState => {
      const skill: Skill = {
        type: "possess",
        transitionType: transitionType,
        level: 1,
        name: "test-skill",
        transition: {
          state: "not_init",
          data: undefined
        },
        property: new TypedMap(new Map(property)),
        data: new TypedMap(),
        onActivated: onActivated,
        onCooldown: onCooldown,
        deactivate: deactivate,
      }
      return {
        ...dencoBase,
        skill: skill
      }
    }

    beforeEach(() => {
      onActivated.mockClear()
      onCooldown.mockClear()
    })

    test("activateSkill-Error(スキルプロパティにactive未定義)", () => {
      const context = initContext("test", "test", false)
      const denco = init("default_timeout", [["cooldown", 10]])
      const state = initUser(context, "test-user", [denco])
      expect(() => activateSkill(context, state, 0)).toThrowError("key:active")

    })
    test("activateSkill-Error(スキルプロパティにcooldown未定義)", () => {
      const context = initContext("test", "test", false)
      const denco = init("default_timeout", [["active", 10]])
      const state = initUser(context, "test-user", [denco])
      expect(() => activateSkill(context, state, 0)).toThrowError("key:cooldown")

    })
    test("activateSkill-Error(active負数)", () => {
      const context = initContext("test", "test", false)
      const denco = init("default_timeout", [["active", -1], ["cooldown", 10]])
      const state = initUser(context, "test-user", [denco])
      expect(() => activateSkill(context, state, 0)).toThrowError("スキル時間が負数")

    })
    test("activateSkill-Error(cooldown負数)", () => {
      const context = initContext("test", "test", false)
      const denco = init("default_timeout", [["active", 10], ["cooldown", -2]])
      const state = initUser(context, "test-user", [denco])
      expect(() => activateSkill(context, state, 0)).toThrowError("スキル時間が負数")

    })
    test("activateSkill-default_timeout", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start
      let denco = init("default_timeout", [["active", 10], ["cooldown", 10]])

      const onUnable = jest.fn((_, state, self) => state)
      if (transitionType === "auto") {
        const skill = getSkill(denco) as SkillLogic<"auto">
        skill.onUnable = onUnable
      }

      let state = initUser(context, "test-user", [denco])
      let s = getSkill(state.formation[0])
      if (transitionType === "auto") {
        expect(s.transition.state).toBe("unable")
        expect(onUnable.mock.calls.length).toBe(1)
        expect(onUnable.mock.calls[0][1]).toMatchObject(state)
        expect(onUnable.mock.calls[0][2]).toMatchDencoState(state.formation[0])
      } else {
        expect(s.transition.state).toBe("idle")
      }
      expect(s.transitionType).toBe(transitionType)
      expect(s.transition.data).toBeUndefined()
      state = activateSkill(context, state, 0)
      denco = state.formation[0]
      s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("active")
      expect(s.transition.data).toMatchObject({
        activatedAt: start,
        activeTimeout: start + 10000,
        cooldownTimeout: start + 20000,
      })

      expect(onActivated.mock.calls.length).toBe(1)
      expect(onActivated.mock.calls[0][1]).toMatchObject(state)
      expect(onActivated.mock.calls[0][2]).toMatchDencoState(denco)
      expect(onCooldown.mock.calls.length).toBe(0)

      expect(() => deactivateSkill(context, state, 0)).toThrowError("active終了時刻")

      context.clock = start + 10000
      state = refreshState(context, state)
      s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("cooldown")
      expect(s.transition.data).toMatchObject({
        cooldownTimeout: start + 20000,
      })
      expect(onActivated.mock.calls.length).toBe(1)
      expect(onCooldown.mock.calls.length).toBe(1)
      expect(onCooldown.mock.calls[0][1]).toMatchObject(state)
      expect(onCooldown.mock.calls[0][2]).toMatchDencoState(state.formation[0])

      context.clock = start + 20000
      state = refreshState(context, state)
      s = getSkill(state.formation[0])
      if (transitionType === "auto") {
        expect(s.transition.state).toBe("unable")
        expect(onUnable.mock.calls.length).toBe(2)
        expect(onUnable.mock.calls[1][1]).toMatchObject(state)
        expect(onUnable.mock.calls[1][2]).toMatchDencoState(state.formation[0])
      } else {
        expect(s.transition.state).toBe("idle")
      }
    })
    test("activateSkill-default_timeout-フィルム補正あり", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let denco = init("default_timeout", [["active", 10], ["cooldown", 10]])
      denco.film = {
        type: "film",
        theme: "theme",
        skillActiveDuration: 1,
        skillCooldownDuration: -2
      }
      let state = initUser(context, "test-user", [denco])
      state = activateSkill(context, state, 0)
      denco = state.formation[0]
      let s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("active")
      expect(s.transition.data).toMatchObject({
        activatedAt: start,
        activeTimeout: start + 11000,
        cooldownTimeout: start + 11000 + 8000,
      })
    })
    test("activateSkill-default_timeout-active:0", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let denco = init("default_timeout", [["active", 0], ["cooldown", 10]])
      let state = initUser(context, "test-user", [denco])
      state = activateSkill(context, state, 0)
      let s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("cooldown")
      expect(s.transition.data).toMatchObject({
        cooldownTimeout: start + 10000,
      })
    })
    test("activateSkill-default_timeout-cooldown:0", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let denco = init("default_timeout", [["active", 10], ["cooldown", 0]])
      let state = initUser(context, "test-user", [denco])
      state = activateSkill(context, state, 0)
      let s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("active")
      expect(s.transition.data).toMatchObject({
        activatedAt: start,
        activeTimeout: start + 10000,
        cooldownTimeout: start + 10000
      })

      context.clock = start + 10000
      state = refreshState(context, state)
      s = getSkill(state.formation[0])
      expect(s.transition.state).toBe(idleState)
      expect(s.transition.data).toBeUndefined()
    })
    test("deactivateSkill-ERROR(cooldown未定義)", () => {

      const context = initContext("test", "test", false)
      const now = context.currentTime
      context.clock = now

      let denco = init("self_deactivate", undefined)
      let state = initUser(context, "test-user", [denco])
      state = activateSkill(context, state, 0)

      expect(() => deactivateSkill(context, state, 0)).toThrowError("key:cooldown")
    })
    test("deactivateSkill-ERROR(cooldown負数)", () => {

      const context = initContext("test", "test", false)
      const now = context.currentTime
      context.clock = now

      let denco = init("self_deactivate", [["cooldown", -1]])
      let state = initUser(context, "test-user", [denco])
      state = activateSkill(context, state, 0)

      expect(() => deactivateSkill(context, state, 0)).toThrowError("スキル時間が負数")
    })
    test("deactivateSkill", () => {

      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let denco = init("self_deactivate", [["cooldown", 10]])

      const onUnable = jest.fn((_, state, self) => state)
      if (transitionType === "auto") {
        const skill = getSkill(denco) as SkillLogic<"auto">
        skill.onUnable = onUnable
      }

      let state = initUser(context, "test-user", [denco])
      let s = getSkill(state.formation[0])
      if (transitionType === "auto") {
        expect(s.transition.state).toBe("unable")
        expect(onUnable.mock.calls.length).toBe(1)
        expect(onUnable.mock.calls[0][1]).toMatchObject(state)
        expect(onUnable.mock.calls[0][2]).toMatchDencoState(state.formation[0])
      } else {
        expect(s.transition.state).toBe("idle")
      }
      expect(s.transitionType).toBe(transitionType)
      expect(s.transition.data).toBeUndefined()
      state = activateSkill(context, state, 0)
      denco = state.formation[0]
      s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("active")
      expect(s.transition.data).toBeUndefined()

      expect(onActivated.mock.calls.length).toBe(1)
      expect(onActivated.mock.calls[0][1]).toMatchObject(state)
      expect(onActivated.mock.calls[0][2]).toMatchDencoState(denco)
      expect(onCooldown.mock.calls.length).toBe(0)

      state = deactivateSkill(context, state, 0)
      s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("cooldown")
      expect(s.transition.data).toMatchObject({
        cooldownTimeout: start + 10000,
      })
      expect(onActivated.mock.calls.length).toBe(1)
      expect(onCooldown.mock.calls.length).toBe(1)
      expect(onCooldown.mock.calls[0][1]).toMatchObject(state)
      expect(onCooldown.mock.calls[0][2]).toMatchDencoState(state.formation[0])

      context.clock = start + 10000
      state = refreshState(context, state)
      s = getSkill(state.formation[0])
      if (transitionType === "auto") {
        expect(s.transition.state).toBe("unable")
        expect(onUnable.mock.calls.length).toBe(2)
        expect(onUnable.mock.calls[1][1]).toMatchObject(state)
        expect(onUnable.mock.calls[1][2]).toMatchDencoState(state.formation[0])
      } else {
        expect(s.transition.state).toBe("idle")
      }
    })
    test("deactivateSkill-フィルム補正あり", () => {

      const context = initContext("test", "test", false)
      const now = context.currentTime
      context.clock = now

      let denco = init("self_deactivate", [["cooldown", 10]])
      denco.film = {
        type: "film",
        theme: "theme",
        skillActiveDuration: 1,
        skillCooldownDuration: -2
      }
      let state = initUser(context, "test-user", [denco])
      state = activateSkill(context, state, 0)
      state = deactivateSkill(context, state, 0)
      let s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("cooldown")
      expect(s.transition.data).toMatchObject({
        cooldownTimeout: now + 8000,
      })
    })
    test("deactivateSkill-cooldown:0", () => {

      const context = initContext("test", "test", false)
      const now = context.currentTime
      context.clock = now

      let denco = init("self_deactivate", [["cooldown", 0]])
      let state = initUser(context, "test-user", [denco])
      state = activateSkill(context, state, 0)
      state = deactivateSkill(context, state, 0)
      let s = getSkill(state.formation[0])
      expect(s.transition.state).toBe(idleState)
      expect(s.transition.data).toBeUndefined()
    })
  })

  describe("manual-condition", () => {
    const canEnabled = jest.fn()
    const onActivated = jest.fn((_, state, self) => state)
    const onCooldown = jest.fn((_, state, self) => state)
    const onUnable = jest.fn((_, state, self) => state)
    const init = (deactivate: SkillDeactivateStrategy, property: undefined | [string, any][]): DencoState => {
      const skill: Skill = {
        type: "possess",
        transitionType: "manual-condition",
        level: 1,
        name: "test-skill",
        transition: {
          state: "not_init",
          data: undefined
        },
        property: new TypedMap(new Map(property)),
        data: new TypedMap(),
        onActivated: onActivated,
        canEnabled: canEnabled,
        onCooldown: onCooldown,
        onUnable: onUnable,
        deactivate: deactivate,
      }
      return {
        ...dencoBase,
        skill: skill
      }
    }

    beforeEach(() => {
      onActivated.mockClear()
      canEnabled.mockClear()
      onUnable.mockClear()
      onCooldown.mockClear()
      canEnabled.mockImplementation((_, state, self) => true)
    })

    // manualと同じ処理の部分は省略

    test("activateSkill-deactivate:default_timeout", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let d = init("default_timeout", [["active", 10], ["cooldown", 10]])
      let state = initUser(context, "test-user", [d])
      d = state.formation[0]
      // refreshSkillStateは差分がなくなるまで繰り返すので１回以上呼び出し
      expect(canEnabled.mock.calls.length).toBeGreaterThan(0)
      expect(canEnabled.mock.calls[0][1]).toMatchObject(state)
      expect(canEnabled.mock.calls[0][2]).toMatchDencoState(d, { skill: { transition: { state: "not_init" } } })
      expect(onUnable.mock.calls.length).toBe(0)
      expect(onCooldown.mock.calls.length).toBe(0)

      let s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("idle")
      expect(s.transitionType).toBe("manual-condition")
      expect(s.transition.data).toBeUndefined()

      state = activateSkill(context, state, 0)
      d = state.formation[0]
      s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("active")
      expect(s.transition.data).toMatchObject({
        activatedAt: start,
        activeTimeout: start + 10000,
        cooldownTimeout: start + 20000,
      })

      expect(onActivated.mock.calls.length).toBe(1)
      expect(onActivated.mock.calls[0][1]).toMatchObject(state)
      expect(onActivated.mock.calls[0][2]).toMatchDencoState(d)
      expect(onUnable.mock.calls.length).toBe(0)
      expect(onCooldown.mock.calls.length).toBe(0)
      
      expect(() => deactivateSkill(context, state, 0)).toThrowError("active終了時刻")

      context.clock = start + 10000
      state = refreshState(context, state)
      s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("cooldown")
      expect(s.transition.data).toMatchObject({
        cooldownTimeout: start + 20000,
      })
      expect(onActivated.mock.calls.length).toBe(1)
      expect(onUnable.mock.calls.length).toBe(0)
      expect(onCooldown.mock.calls.length).toBe(1)
      expect(onCooldown.mock.calls[0][1]).toMatchObject(state)
      expect(onCooldown.mock.calls[0][2]).toMatchDencoState(state.formation[0])

      canEnabled.mockClear()
      canEnabled.mockImplementation((_, state, self) => false)
      context.clock = start + 20000
      state = refreshState(context, state)
      s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("unable")
      expect(canEnabled.mock.calls.length).toBeGreaterThan(0)
      d = state.formation[0]
      expect(onActivated.mock.calls.length).toBe(1)
      expect(onUnable.mock.calls.length).toBe(1)
      expect(onCooldown.mock.calls.length).toBe(1)
      expect(onUnable.mock.calls[0][1]).toMatchObject(state)
      expect(onUnable.mock.calls[0][2]).toMatchDencoState(d, { skill: { transition: { state: "unable" } } })
    })


    test("onUnable呼び出し@初期化", () => {
      const context = initContext("test", "test", false)
      canEnabled.mockImplementation((_, state, self) => false)

      let d = init("default_timeout", [["active", 10], ["cooldown", 10]])
      let state = initUser(context, "test-user", [d])
      d = state.formation[0]
      // refreshSkillStateは差分がなくなるまで繰り返すので１回以上呼び出し
      expect(canEnabled.mock.calls.length).toBeGreaterThan(0)
      expect(canEnabled.mock.calls[0][1]).toMatchObject(state)
      expect(canEnabled.mock.calls[0][2]).toMatchDencoState(d, { skill: { transition: { state: "not_init" } } })
      expect(onUnable.mock.calls.length).toBe(1)
      expect(onUnable.mock.calls[0][1]).toMatchObject(state)
      expect(onUnable.mock.calls[0][2]).toMatchDencoState(d, { skill: { transition: { state: "unable" } } })
    })

    test("deactivateSkill", () => {

      const context = initContext("test", "test", false)
      const now = context.currentTime
      context.clock = now

      let d = init("self_deactivate", [["cooldown", 10]])
      let state = initUser(context, "test-user", [d])
      d = state.formation[0]
      // refreshSkillStateは差分がなくなるまで繰り返すので１回以上呼び出し
      expect(canEnabled.mock.calls.length).toBeGreaterThan(0)
      expect(canEnabled.mock.calls[0][1]).toMatchObject(state)
      expect(canEnabled.mock.calls[0][2]).toMatchDencoState(d, { skill: { transition: { state: "not_init" } } })
      expect(onUnable.mock.calls.length).toBe(0)
      expect(onCooldown.mock.calls.length).toBe(0)

      let s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("idle")
      expect(s.transitionType).toBe("manual-condition")
      expect(s.transition.data).toBeUndefined()
      state = activateSkill(context, state, 0)
      d = state.formation[0]
      s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("active")
      expect(s.transition.data).toBeUndefined()

      expect(onActivated.mock.calls.length).toBe(1)
      expect(onActivated.mock.calls[0][1]).toMatchObject(state)
      expect(onActivated.mock.calls[0][2]).toMatchDencoState(d)
      expect(onUnable.mock.calls.length).toBe(0)
      expect(onCooldown.mock.calls.length).toBe(0)

      state = deactivateSkill(context, state, 0)
      s = getSkill(state.formation[0])
      expect(s.transition.state).toBe("cooldown")
      expect(s.transition.data).toMatchObject({
        cooldownTimeout: now + 10000,
      })
      expect(onActivated.mock.calls.length).toBe(1)
      expect(onUnable.mock.calls.length).toBe(0)
      expect(onCooldown.mock.calls.length).toBe(1)
      expect(onCooldown.mock.calls[0][1]).toMatchObject(state)
      expect(onCooldown.mock.calls[0][2]).toMatchDencoState(state.formation[0])
    })

  })

  describe("auto-condition", () => {

    const canActivated = jest.fn()
    const onActivated = jest.fn((_, state, self) => state)
    const onUnable = jest.fn((_, state, self) => state)
    const init = (): DencoState => {
      const skill: Skill = {
        type: "possess",
        transitionType: "auto-condition",
        level: 1,
        name: "test-skill",
        transition: {
          state: "not_init",
          data: undefined
        },
        property: new TypedMap(),
        data: new TypedMap(),
        onActivated: onActivated,
        canActivated: canActivated,
        onUnable: onUnable,
      }
      return {
        ...dencoBase,
        skill: skill
      }
    }

    beforeEach(() => {
      onActivated.mockClear()
      onUnable.mockClear()
      canActivated.mockClear()
      canActivated.mockImplementation((_, state, self) => true)
    })

    test("activate/deactivateSkill - Error", () => {
      const context = initContext("test", "test", false)
      const denco = init()
      let state = initUser(context, "user", [denco])
      expect(() => activateSkill(context, state, 0)).toThrowError()
      expect(() => deactivateSkill(context, state, 0)).toThrowError()
    })
    test("active, unable状態遷移", () => {
      const context = initContext("test", "test", false)
      let d = init()

      let state = initUser(context, "user", [d])
      d = state.formation[0]
      let s = getSkill(d)
      // refreshSkillStateは差分がなくなるまで繰り返すので１回以上呼び出し
      expect(canActivated.mock.calls.length).toBeGreaterThan(0)
      expect(canActivated.mock.calls[0][1]).toMatchObject(state)
      expect(canActivated.mock.calls[0][2]).toMatchDencoState(d, { skill: { transition: { state: "not_init" } } })
      expect(s.transition.state).toBe("active")
      expect(s.transition.data).toBeUndefined()
      expect(s.transitionType).toBe("auto-condition")
      expect(onActivated.mock.calls.length).toBe(1)
      expect(onActivated.mock.calls[0][1]).toMatchObject(state)
      expect(onActivated.mock.calls[0][2]).toMatchDencoState(d)
      expect(onUnable.mock.calls.length).toBe(0)

      canActivated.mockClear()
      canActivated.mockImplementation((_, state, self) => false)
      state = refreshState(context, state)
      d = state.formation[0]
      s = getSkill(d)
      // refreshSkillStateは差分がなくなるまで繰り返すので１回以上呼び出し
      expect(canActivated.mock.calls.length).toBeGreaterThan(0)
      expect(canActivated.mock.calls[0][1]).toMatchObject(state)
      expect(canActivated.mock.calls[0][2]).toMatchDencoState(d, { skill: { transition: { state: "active" } } })
      expect(onUnable.mock.calls.length).toBe(1)
      expect(onUnable.mock.calls[0][1]).toMatchObject(state)
      expect(onUnable.mock.calls[0][2]).toMatchDencoState(d, { skill: { transition: { state: "unable" } } })
      expect(s.transition.state).toBe("unable")
    })

    test("onUnable呼び出し@初期化", () => {
      const context = initContext("test", "test", false)
      let d = init()
      canActivated.mockImplementation((_, state, self) => false)

      let state = initUser(context, "user", [d])
      d = state.formation[0]
      let s = getSkill(d)
      // refreshSkillStateは差分がなくなるまで繰り返すので１回以上呼び出し
      expect(canActivated.mock.calls.length).toBeGreaterThan(0)
      expect(canActivated.mock.calls[0][1]).toMatchObject(state)
      expect(canActivated.mock.calls[0][2]).toMatchDencoState(d, { skill: { transition: { state: "not_init" } } })
      expect(onActivated.mock.calls.length).toBe(0)
      expect(onUnable.mock.calls.length).toBe(1)
      expect(onUnable.mock.calls[0][1]).toMatchObject(state)
      expect(onUnable.mock.calls[0][2]).toMatchDencoState(d, { skill: { transition: { state: "unable" } } })
      expect(s.transition.state).toBe("unable")
    })
  })

  test("always", () => {
    const skill: Skill = {
      type: "possess",
      transitionType: "always",
      level: 1,
      name: "test-skill",
      transition: {
        state: "not_init",
        data: undefined
      },
      property: new TypedMap(),
      data: new TypedMap(),
    }
    let d: DencoState = {
      ...dencoBase,
      skill: skill
    }
    const context = initContext("test", "test", false)
    let state = initUser(context, "user", [d])
    d = state.formation[0]
    let s = getSkill(d)

    expect(s.transitionType).toBe("always")
    expect(s.transition.state).toBe("active")
    expect(s.transition.data).toBeUndefined()

    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => deactivateSkill(context, state, 0)).toThrowError()
  })


  test("onHourCycleコールバック", () => {
    // とりあえずalwaysタイプのみ

    const context = initContext("test", "test", false)
    let now = Date.parse("2020-01-01T12:50:00.000")
    context.clock = now
    // mock callback
    const onHourCycle = jest.fn((_, state, self) => state)
    const skill: Skill = {
      type: "possess",
      transitionType: "always",
      level: 1,
      name: "test-skill",
      transition: {
        state: "not_init",
        data: undefined
      },
      property: new TypedMap(),
      data: new TypedMap(),
      onHourCycle: onHourCycle,
    }
    let denco: DencoState = {
      ...dencoBase,
      skill: skill,
    }
    let state = initUser(context, "test-user", [denco])
    // check event queue
    expect(state.queue.length).toBe(1)
    let entry = state.queue[0]
    expect(entry.type).toBe("hour_cycle")
    let date = new Date(now)
    let hour = date.getHours()
    expect(entry.time).toBe(date.setHours(hour + 1, 0, 0, 0))

    // 10分経過
    now += 600 * 1000
    context.clock = now
    state = refreshState(context, state)
    expect(onHourCycle.mock.calls.length).toBe(1)
    expect(state.queue.length).toBe(1)
    entry = state.queue[0]
    expect(entry.type).toBe("hour_cycle")
    date = new Date(now)
    hour = date.getHours()
    expect(entry.time).toBe(date.setHours(hour + 1, 0, 0, 0))
  })
})