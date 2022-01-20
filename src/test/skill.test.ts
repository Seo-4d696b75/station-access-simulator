import { activateSkill, isSkillActive, Skill, SkillActiveTimeout } from "../core/skill"
import { initContext } from "../core/context"
import { DencoState, getSkill } from "../core/denco"
import { initUser } from "../core/user"

describe("スキル処理", () => {
  test("manual-activateSkill", () => {
    const context = initContext("test", "test", false)
    const now = Date.now()
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
      transitionType: "manual",
      state: {
        type: "not_init",
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
      skillHolder: {
        type: "possess",
        skill: skill
      }
    }
    const state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("idle")
    const next = activateSkill(context, { ...state, carIndex: 0 })
    // state: active変更前
    expect(disactivateAt.mock.calls.length).toBe(1)
    // state: active変更前
    denco = next.formation[0]
    expect(isSkillActive(denco.skillHolder)).toBe(true)
    expect(getSkill(denco).state.data).toMatchObject(timeout)
    expect(onActivated.mock.calls.length).toBe(1)
    expect(onActivated.mock.calls[0][1]).toMatchObject(next)
    expect(onActivated.mock.calls[0][2]).toMatchObject(denco)
  })
  test("manual-condition-activateSkill", () => {
    const context = initContext("test", "test", false)
    const now = Date.now()
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
      transitionType: "manual-condition",
      state: {
        type: "not_init",
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
      skillHolder: {
        type: "possess",
        skill: skill
      }
    }
    expect(() => initUser(context, "test-user", [denco])).toThrowError()
    skill.canEnabled = canEnabled
    let state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("idle")
    expect(canEnabled.mock.calls.length).toBe(1)
    let next = activateSkill(context, { ...state, carIndex: 0 })
    // state: active変更前
    expect(disactivateAt.mock.calls.length).toBe(1)
    // state: active変更前
    denco = next.formation[0]
    expect(isSkillActive(denco.skillHolder)).toBe(true)
    expect(getSkill(denco).state.data).toMatchObject(timeout)
    expect(onActivated.mock.calls.length).toBe(1)
    expect(onActivated.mock.calls[0][1]).toMatchObject(next)
    expect(onActivated.mock.calls[0][2]).toMatchObject(denco)
  })
  test("auto-activateSkill", () => {
    const context = initContext("test", "test", false)
    const now = Date.now()
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
      transitionType: "auto",
      state: {
        type: "not_init",
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
      skillHolder: {
        type: "possess",
        skill: skill
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
    expect(isSkillActive(denco.skillHolder)).toBe(true)
    expect(getSkill(denco).state.data).toMatchObject(timeout)
    expect(onActivated.mock.calls.length).toBe(1)
    expect(onActivated.mock.calls[0][1]).toMatchObject(next)
    expect(onActivated.mock.calls[0][2]).toMatchObject(denco)
  })

  test("auto-condition-activateSkill", () => {
    const context = initContext("test", "test", false)
    const now = Date.now()
    context.clock = now
    // mock callback
    const canActivated = jest.fn((_, state, self) => true)
    const onActivated = jest.fn((_, state, self) => state)
    const skill: Skill = {
      level: 1,
      name: "test-skill",
      transitionType: "auto-condition",
      state: {
        type: "not_init",
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
      skillHolder: {
        type: "possess",
        skill: skill
      }
    }
    expect(() => initUser(context, "test-user", [denco])).toThrowError()
    skill.canActivated = canActivated
    let state = initUser(context, "test-user", [denco])
    denco = state.formation[0]
    expect(getSkill(denco).state.type).toBe("active")
    expect(() => activateSkill(context, { ...state, carIndex: 0 }))
    expect(canActivated.mock.calls.length).toBe(1)
    expect(isSkillActive(denco.skillHolder)).toBe(true)
    expect(getSkill(denco).state.data).toBeUndefined()
    expect(onActivated.mock.calls.length).toBe(1)
    expect(onActivated.mock.calls[0][1]).toMatchObject(state)
    expect(onActivated.mock.calls[0][2]).toMatchObject(denco)
  })
})