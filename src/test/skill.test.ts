import { activateSkill, disactivateSkill, getSkill, isSkillActive, refreshSkillState, Skill, SkillActiveTimeout, SkillCooldownTimeout } from "../core/skill"
import { initContext } from "../core/context"
import { DencoState } from "../core/denco"
import { initUser, refreshCurrentTime } from "../core/user"
import moment from "moment-timezone"

describe("スキル処理", () => {
  test("manual-activateSkill", () => {
    const context = initContext("test", "test", false)
    const now = moment().valueOf()
    context.clock = now
    // mock callback
    const timeout: SkillActiveTimeout = {
      activeTimeout: now + 1000,
      cooldownTimeout: now + 2000,
    }
    const disactivateAt = jest.fn((_, state, self) => timeout)
    const onActivated = jest.fn((_, state, self) => state)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      state: {
        type: "not_init",
        transition: "manual",
        data: undefined
      },
      propertyReader: jest.fn(),
      onActivated: onActivated,
      disactivateAt: disactivateAt,
    }
    let denco: DencoState = {
      level: 5,
      name: "denco",
      numbering: "test",
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: [],
      film: {},
      type: "supporter",
      attr: "flat",
      skill: {
        type: "possess",
        ...skill
      }
    }
    const state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(denco.skill.type).toBe("possess")
    let s = denco.skill as Skill
    expect(s.state.type).toBe("idle")
    const next = activateSkill(context, { ...state, carIndex: 0 })
    // state: active変更前
    expect(disactivateAt.mock.calls.length).toBe(1)
    // state: active変更前
    denco = next.formation[0]
    expect(isSkillActive(denco.skill)).toBe(true)
    expect(getSkill(denco).state.data).toMatchObject(timeout)
    expect(onActivated.mock.calls.length).toBe(1)
    expect(onActivated.mock.calls[0][1]).toMatchObject(next)
    expect(onActivated.mock.calls[0][2]).toMatchObject(denco)
  })
  test("manual-condition-activateSkill", () => {
    const context = initContext("test", "test", false)
    const now = moment().valueOf()
    context.clock = now
    // mock callback
    const timeout: SkillActiveTimeout = {
      activeTimeout: now + 1000,
      cooldownTimeout: now + 2000,
    }
    const canEnabled = jest.fn((_, state, self) => true)
    const disactivateAt = jest.fn((_, state, self) => timeout)
    const onActivated = jest.fn((_, state, self) => state)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      state: {
        type: "not_init",
        transition: "manual-condition",
        data: undefined
      },
      propertyReader: jest.fn(),
      onActivated: onActivated,
      disactivateAt: disactivateAt,
    }
    let denco: DencoState = {
      level: 5,
      name: "denco",
      numbering: "test",
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: [],
      film: {},
      type: "supporter",
      attr: "flat",
      skill: {
        type: "possess",
        ...skill
      }
    }
    expect(() => initUser(context, "test-user", [denco])).toThrowError()
    skill.canEnabled = canEnabled
    denco.skill = {
      type: "possess",
      ...skill
    }
    let state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("idle")
    expect(canEnabled.mock.calls.length).toBe(1)
    let next = activateSkill(context, { ...state, carIndex: 0 })
    // state: active変更前
    expect(disactivateAt.mock.calls.length).toBe(1)
    // state: active変更前
    denco = next.formation[0]
    expect(isSkillActive(denco.skill)).toBe(true)
    expect(getSkill(denco).state.data).toMatchObject(timeout)
    expect(onActivated.mock.calls.length).toBe(1)
    expect(onActivated.mock.calls[0][1]).toMatchObject(next)
    expect(onActivated.mock.calls[0][2]).toMatchObject(denco)
  })
  test("auto-activateSkill", () => {
    const context = initContext("test", "test", false)
    const now = moment().valueOf()
    context.clock = now
    // mock callback
    const timeout: SkillActiveTimeout = {
      activeTimeout: now + 1000,
      cooldownTimeout: now + 2000,
    }
    const disactivateAt = jest.fn((_, state, self) => timeout)
    const onActivated = jest.fn((_, state, self) => state)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      state: {
        type: "not_init",
        transition: "auto",
        data: undefined
      },
      propertyReader: jest.fn(),
      onActivated: onActivated,
      disactivateAt: disactivateAt,
    }
    let denco: DencoState = {
      level: 5,
      name: "denco",
      numbering: "test",
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: [],
      film: {},
      type: "supporter",
      attr: "flat",
      skill: {
        type: "possess",
        ...skill
      }
    }
    const state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("unable")
    const next = activateSkill(context, { ...state, carIndex: 0 })
    // state: active変更前
    expect(disactivateAt.mock.calls.length).toBe(1)
    // state: active変更前
    denco = next.formation[0]
    expect(isSkillActive(denco.skill)).toBe(true)
    expect(getSkill(denco).state.data).toMatchObject(timeout)
    expect(onActivated.mock.calls.length).toBe(1)
    expect(onActivated.mock.calls[0][1]).toMatchObject(next)
    expect(onActivated.mock.calls[0][2]).toMatchObject(denco)
  })

  test("auto-condition-activateSkill", () => {
    const context = initContext("test", "test", false)
    const now = moment().valueOf()
    context.clock = now
    // mock callback
    const canActivated = jest.fn((_, state, self) => true)
    const onActivated = jest.fn((_, state, self) => state)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      state: {
        type: "not_init",
        transition: "auto-condition",
        data: undefined
      },
      propertyReader: jest.fn(),
      onActivated: onActivated,
    }
    let denco: DencoState = {
      level: 5,
      name: "denco",
      numbering: "test",
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: [],
      film: {},
      type: "supporter",
      attr: "flat",
      skill: {
        type: "possess",
        ...skill
      }
    }
    expect(() => initUser(context, "test-user", [denco])).toThrowError()
    skill.canActivated = canActivated
    denco.skill = {
      type: "possess",
      ...skill
    }
    let state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("active")
    expect(() => activateSkill(context, { ...state, carIndex: 0 }))
    expect(canActivated.mock.calls.length).toBe(1)
    expect(isSkillActive(denco.skill)).toBe(true)
    expect(getSkill(denco).state.data).toBeUndefined()
    expect(onActivated.mock.calls.length).toBe(1)
    expect(onActivated.mock.calls[0][1]).toMatchObject(state)
    expect(onActivated.mock.calls[0][2]).toMatchObject(denco)
  })

  test("disactivateSkill-エラー", () => {
    const context = initContext("test", "test", false)
    const now = moment().valueOf()
    context.clock = now
    // mock callback
    const timeout: SkillActiveTimeout = {
      activeTimeout: now + 1000,
      cooldownTimeout: now + 2000,
    }
    const disactivateAt = jest.fn((_, state, self) => timeout)
    const completeCooldownAt = jest.fn((_, state, self) => timeout)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      state: {
        type: "not_init",
        transition: "manual",
        data: undefined
      },
      propertyReader: jest.fn(),
      disactivateAt: disactivateAt,
      completeCooldownAt: completeCooldownAt,
    }
    let denco: DencoState = {
      level: 5,
      name: "denco",
      numbering: "test",
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: [],
      film: {},
      type: "supporter",
      attr: "flat",
      skill: {
        type: "possess",
        ...skill
      }
    }
    let state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("idle")
    state = activateSkill(context, { ...state, carIndex: 0 })
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("active")
    expect(getSkill(denco).state.data).toMatchObject(timeout)
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 }))
    context.clock = now + 1000
    state = refreshSkillState(context, state)
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("cooldown")
    context.clock = now + 2000
    state = refreshSkillState(context, state)
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("idle")
    expect(disactivateAt.mock.calls.length).toBe(1)
    expect(completeCooldownAt.mock.calls.length).toBe(0)
  })

  test("manual-disactivateSkill", () => {
    const context = initContext("test", "test", false)
    const now = moment().valueOf()
    context.clock = now
    // mock callback
    const timeout: SkillCooldownTimeout = {
      cooldownTimeout: now + 2000,
    }
    const completeCooldownAt = jest.fn((_, state, self) => timeout)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      state: {
        type: "not_init",
        transition: "manual",
        data: undefined
      },
      propertyReader: jest.fn(),
      disactivateAt: undefined,
    }
    let denco: DencoState = {
      level: 5,
      name: "denco",
      numbering: "test",
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: [],
      film: {},
      type: "supporter",
      attr: "flat",
      skill: {
        type: "possess",
        ...skill
      }
    }
    let state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("idle")
    state = activateSkill(context, { ...state, carIndex: 0 })
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("active")
    expect(getSkill(denco).state.data).toBeUndefined()
    context.clock = now + 1000
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 }))
    getSkill(denco).completeCooldownAt = completeCooldownAt
    state = disactivateSkill(context, { ...state, carIndex: 0 })
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("cooldown")
    expect(getSkill(denco).state.data).toMatchObject(timeout)
    context.clock = now + 2000
    state = refreshSkillState(context, state)
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("idle")
    expect(completeCooldownAt.mock.calls.length).toBe(1)
  })

  test("manual-condition-disactivateSkill", () => {
    const context = initContext("test", "test", false)
    const now = moment().valueOf()
    context.clock = now
    // mock callback
    const timeout: SkillCooldownTimeout = {
      cooldownTimeout: now + 2000,
    }
    const canEnabled = jest.fn((_, state, self) => true)
    const completeCooldownAt = jest.fn((_, state, self) => timeout)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      state: {
        type: "not_init",
        transition: "manual-condition",
        data: undefined
      },
      propertyReader: jest.fn(),
      disactivateAt: undefined,
      canEnabled: canEnabled,
    }
    let denco: DencoState = {
      level: 5,
      name: "denco",
      numbering: "test",
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: [],
      film: {},
      type: "supporter",
      attr: "flat",
      skill: {
        type: "possess",
        ...skill
      }
    }
    let state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("idle")
    state = activateSkill(context, { ...state, carIndex: 0 })
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("active")
    expect(getSkill(denco).state.data).toBeUndefined()
    context.clock = now + 1000
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 }))
    getSkill(denco).completeCooldownAt = completeCooldownAt
    state = disactivateSkill(context, { ...state, carIndex: 0 })
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("cooldown")
    expect(getSkill(denco).state.data).toMatchObject(timeout)
    context.clock = now + 2000
    state = refreshSkillState(context, state)
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("idle")
    expect(completeCooldownAt.mock.calls.length).toBe(1)
  })
  test("auto-disactivateSkill", () => {
    const context = initContext("test", "test", false)
    const now = moment().valueOf()
    context.clock = now
    // mock callback
    const timeout: SkillCooldownTimeout = {
      cooldownTimeout: now + 2000,
    }
    const completeCooldownAt = jest.fn((_, state, self) => timeout)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      state: {
        type: "not_init",
        transition: "auto",
        data: undefined
      },
      propertyReader: jest.fn(),
      disactivateAt: undefined,
    }
    let denco: DencoState = {
      level: 5,
      name: "denco",
      numbering: "test",
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: [],
      film: {},
      type: "supporter",
      attr: "flat",
      skill: {
        type: "possess",
        ...skill
      }
    }
    let state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("unable")
    state = activateSkill(context, { ...state, carIndex: 0 })
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("active")
    expect(getSkill(denco).state.data).toBeUndefined()
    context.clock = now + 1000
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 }))
    getSkill(denco).completeCooldownAt = completeCooldownAt
    state = disactivateSkill(context, { ...state, carIndex: 0 })
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("cooldown")
    expect(getSkill(denco).state.data).toMatchObject(timeout)
    context.clock = now + 2000
    state = refreshSkillState(context, state)
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("unable")
    expect(completeCooldownAt.mock.calls.length).toBe(1)
  })
  test("auto-condition-disactivateSkill", () => {
    const context = initContext("test", "test", false)
    const now = moment().valueOf()
    context.clock = now
    // mock callback
    const canActivated = jest.fn((_, state, self) => true)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      state: {
        type: "not_init",
        transition: "auto-condition",
        data: undefined
      },
      propertyReader: jest.fn(),
      canActivated: canActivated,
    }
    let denco: DencoState = {
      level: 5,
      name: "denco",
      numbering: "test",
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: [],
      film: {},
      type: "supporter",
      attr: "flat",
      skill: {
        type: "possess",
        ...skill
      }
    }
    let state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("active")
    expect(canActivated.mock.calls.length).toBe(1)
    expect(getSkill(denco).state.data).toBeUndefined()
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 })).toThrowError()
  })
  test("onHourCycle-コールバック", () => {
    const context = initContext("test", "test", false)
    let now = Date.parse("2020-01-01T12:50:00.000")
    context.clock = now
    // mock callback
    const onHourCycle = jest.fn((_, state, self) => state)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      state: {
        type: "not_init",
        transition: "always",
        data: undefined
      },
      propertyReader: jest.fn(),
      onHourCycle: onHourCycle,
    }
    let denco: DencoState = {
      level: 5,
      name: "denco",
      numbering: "test",
      currentExp: 0,
      nextExp: 100,
      currentHp: 50,
      maxHp: 50,
      ap: 10,
      link: [],
      film: {},
      type: "supporter",
      attr: "flat",
      skill: {
        type: "possess",
        ...skill
      }
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
    state = refreshCurrentTime(context, state)
    expect(onHourCycle.mock.calls.length).toBe(1)
    expect(state.queue.length).toBe(1)
    entry = state.queue[0]
    expect(entry.type).toBe("hour_cycle")
    date = new Date(now)
    hour = date.getHours()
    expect(entry.time).toBe(date.setHours(hour + 1, 0, 0, 0))
  })
})