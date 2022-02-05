"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var skill_1 = require("../core/skill");
var context_1 = require("../core/context");
var denco_1 = require("../core/denco");
var user_1 = require("../core/user");
describe("スキル処理", function () {
    test("manual-activateSkill", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var now = Date.now();
        context.clock = now;
        // mock callback
        var timeout = {
            activeTimeout: now + 1000,
            cooldownTimeout: now + 2000,
        };
        var disactivateAt = jest.fn(function (_, state, self) { return timeout; });
        var onActivated = jest.fn(function (_, state, self) { return state; });
        var skill = {
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
        };
        var denco = {
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
        };
        var state = (0, user_1.initUser)(context, "test-user", [denco]);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("idle");
        var next = (0, skill_1.activateSkill)(context, __assign(__assign({}, state), { carIndex: 0 }));
        // state: active変更前
        expect(disactivateAt.mock.calls.length).toBe(1);
        // state: active変更前
        denco = next.formation[0];
        expect((0, skill_1.isSkillActive)(denco.skillHolder)).toBe(true);
        expect((0, denco_1.getSkill)(denco).state.data).toMatchObject(timeout);
        expect(onActivated.mock.calls.length).toBe(1);
        expect(onActivated.mock.calls[0][1]).toMatchObject(next);
        expect(onActivated.mock.calls[0][2]).toMatchObject(denco);
    });
    test("manual-condition-activateSkill", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var now = Date.now();
        context.clock = now;
        // mock callback
        var timeout = {
            activeTimeout: now + 1000,
            cooldownTimeout: now + 2000,
        };
        var canEnabled = jest.fn(function (_, state, self) { return true; });
        var disactivateAt = jest.fn(function (_, state, self) { return timeout; });
        var onActivated = jest.fn(function (_, state, self) { return state; });
        var skill = {
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
        };
        var denco = {
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
        };
        expect(function () { return (0, user_1.initUser)(context, "test-user", [denco]); }).toThrowError();
        skill.canEnabled = canEnabled;
        var state = (0, user_1.initUser)(context, "test-user", [denco]);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("idle");
        expect(canEnabled.mock.calls.length).toBe(1);
        var next = (0, skill_1.activateSkill)(context, __assign(__assign({}, state), { carIndex: 0 }));
        // state: active変更前
        expect(disactivateAt.mock.calls.length).toBe(1);
        // state: active変更前
        denco = next.formation[0];
        expect((0, skill_1.isSkillActive)(denco.skillHolder)).toBe(true);
        expect((0, denco_1.getSkill)(denco).state.data).toMatchObject(timeout);
        expect(onActivated.mock.calls.length).toBe(1);
        expect(onActivated.mock.calls[0][1]).toMatchObject(next);
        expect(onActivated.mock.calls[0][2]).toMatchObject(denco);
    });
    test("auto-activateSkill", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var now = Date.now();
        context.clock = now;
        // mock callback
        var timeout = {
            activeTimeout: now + 1000,
            cooldownTimeout: now + 2000,
        };
        var disactivateAt = jest.fn(function (_, state, self) { return timeout; });
        var onActivated = jest.fn(function (_, state, self) { return state; });
        var skill = {
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
        };
        var denco = {
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
        };
        var state = (0, user_1.initUser)(context, "test-user", [denco]);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("unable");
        var next = (0, skill_1.activateSkill)(context, __assign(__assign({}, state), { carIndex: 0 }));
        // state: active変更前
        expect(disactivateAt.mock.calls.length).toBe(1);
        // state: active変更前
        denco = next.formation[0];
        expect((0, skill_1.isSkillActive)(denco.skillHolder)).toBe(true);
        expect((0, denco_1.getSkill)(denco).state.data).toMatchObject(timeout);
        expect(onActivated.mock.calls.length).toBe(1);
        expect(onActivated.mock.calls[0][1]).toMatchObject(next);
        expect(onActivated.mock.calls[0][2]).toMatchObject(denco);
    });
    test("auto-condition-activateSkill", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var now = Date.now();
        context.clock = now;
        // mock callback
        var canActivated = jest.fn(function (_, state, self) { return true; });
        var onActivated = jest.fn(function (_, state, self) { return state; });
        var skill = {
            level: 1,
            name: "test-skill",
            transitionType: "auto-condition",
            state: {
                type: "not_init",
                data: undefined
            },
            propertyReader: jest.fn(),
            onActivated: onActivated,
        };
        var denco = {
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
        };
        expect(function () { return (0, user_1.initUser)(context, "test-user", [denco]); }).toThrowError();
        skill.canActivated = canActivated;
        var state = (0, user_1.initUser)(context, "test-user", [denco]);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("active");
        expect(function () { return (0, skill_1.activateSkill)(context, __assign(__assign({}, state), { carIndex: 0 })); });
        expect(canActivated.mock.calls.length).toBe(1);
        expect((0, skill_1.isSkillActive)(denco.skillHolder)).toBe(true);
        expect((0, denco_1.getSkill)(denco).state.data).toBeUndefined();
        expect(onActivated.mock.calls.length).toBe(1);
        expect(onActivated.mock.calls[0][1]).toMatchObject(state);
        expect(onActivated.mock.calls[0][2]).toMatchObject(denco);
    });
    test("disactivateSkill-エラー", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var now = Date.now();
        context.clock = now;
        // mock callback
        var timeout = {
            activeTimeout: now + 1000,
            cooldownTimeout: now + 2000,
        };
        var disactivateAt = jest.fn(function (_, state, self) { return timeout; });
        var completeCooldownAt = jest.fn(function (_, state, self) { return timeout; });
        var skill = {
            level: 1,
            name: "test-skill",
            transitionType: "manual",
            state: {
                type: "not_init",
                data: undefined
            },
            propertyReader: jest.fn(),
            disactivateAt: disactivateAt,
            completeCooldownAt: completeCooldownAt,
        };
        var denco = {
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
        };
        var state = (0, user_1.initUser)(context, "test-user", [denco]);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("idle");
        state = (0, skill_1.activateSkill)(context, __assign(__assign({}, state), { carIndex: 0 }));
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("active");
        expect((0, denco_1.getSkill)(denco).state.data).toMatchObject(timeout);
        expect(function () { return (0, skill_1.disactivateSkill)(context, __assign(__assign({}, state), { carIndex: 0 })); });
        context.clock = now + 1000;
        state = (0, skill_1.refreshSkillState)(context, state);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("cooldown");
        context.clock = now + 2000;
        state = (0, skill_1.refreshSkillState)(context, state);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("idle");
        expect(disactivateAt.mock.calls.length).toBe(1);
        expect(completeCooldownAt.mock.calls.length).toBe(0);
    });
    test("manual-disactivateSkill", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var now = Date.now();
        context.clock = now;
        // mock callback
        var timeout = {
            cooldownTimeout: now + 2000,
        };
        var completeCooldownAt = jest.fn(function (_, state, self) { return timeout; });
        var skill = {
            level: 1,
            name: "test-skill",
            transitionType: "manual",
            state: {
                type: "not_init",
                data: undefined
            },
            propertyReader: jest.fn(),
            disactivateAt: undefined,
        };
        var denco = {
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
        };
        var state = (0, user_1.initUser)(context, "test-user", [denco]);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("idle");
        state = (0, skill_1.activateSkill)(context, __assign(__assign({}, state), { carIndex: 0 }));
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("active");
        expect((0, denco_1.getSkill)(denco).state.data).toBeUndefined();
        context.clock = now + 1000;
        expect(function () { return (0, skill_1.disactivateSkill)(context, __assign(__assign({}, state), { carIndex: 0 })); });
        (0, denco_1.getSkill)(denco).completeCooldownAt = completeCooldownAt;
        state = (0, skill_1.disactivateSkill)(context, __assign(__assign({}, state), { carIndex: 0 }));
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("cooldown");
        expect((0, denco_1.getSkill)(denco).state.data).toMatchObject(timeout);
        context.clock = now + 2000;
        state = (0, skill_1.refreshSkillState)(context, state);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("idle");
        expect(completeCooldownAt.mock.calls.length).toBe(1);
    });
    test("manual-condition-disactivateSkill", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var now = Date.now();
        context.clock = now;
        // mock callback
        var timeout = {
            cooldownTimeout: now + 2000,
        };
        var canEnabled = jest.fn(function (_, state, self) { return true; });
        var completeCooldownAt = jest.fn(function (_, state, self) { return timeout; });
        var skill = {
            level: 1,
            name: "test-skill",
            transitionType: "manual-condition",
            state: {
                type: "not_init",
                data: undefined
            },
            propertyReader: jest.fn(),
            disactivateAt: undefined,
            canEnabled: canEnabled,
        };
        var denco = {
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
        };
        var state = (0, user_1.initUser)(context, "test-user", [denco]);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("idle");
        state = (0, skill_1.activateSkill)(context, __assign(__assign({}, state), { carIndex: 0 }));
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("active");
        expect((0, denco_1.getSkill)(denco).state.data).toBeUndefined();
        context.clock = now + 1000;
        expect(function () { return (0, skill_1.disactivateSkill)(context, __assign(__assign({}, state), { carIndex: 0 })); });
        (0, denco_1.getSkill)(denco).completeCooldownAt = completeCooldownAt;
        state = (0, skill_1.disactivateSkill)(context, __assign(__assign({}, state), { carIndex: 0 }));
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("cooldown");
        expect((0, denco_1.getSkill)(denco).state.data).toMatchObject(timeout);
        context.clock = now + 2000;
        state = (0, skill_1.refreshSkillState)(context, state);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("idle");
        expect(completeCooldownAt.mock.calls.length).toBe(1);
    });
    test("auto-disactivateSkill", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var now = Date.now();
        context.clock = now;
        // mock callback
        var timeout = {
            cooldownTimeout: now + 2000,
        };
        var completeCooldownAt = jest.fn(function (_, state, self) { return timeout; });
        var skill = {
            level: 1,
            name: "test-skill",
            transitionType: "auto",
            state: {
                type: "not_init",
                data: undefined
            },
            propertyReader: jest.fn(),
            disactivateAt: undefined,
        };
        var denco = {
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
        };
        var state = (0, user_1.initUser)(context, "test-user", [denco]);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("unable");
        state = (0, skill_1.activateSkill)(context, __assign(__assign({}, state), { carIndex: 0 }));
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("active");
        expect((0, denco_1.getSkill)(denco).state.data).toBeUndefined();
        context.clock = now + 1000;
        expect(function () { return (0, skill_1.disactivateSkill)(context, __assign(__assign({}, state), { carIndex: 0 })); });
        (0, denco_1.getSkill)(denco).completeCooldownAt = completeCooldownAt;
        state = (0, skill_1.disactivateSkill)(context, __assign(__assign({}, state), { carIndex: 0 }));
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("cooldown");
        expect((0, denco_1.getSkill)(denco).state.data).toMatchObject(timeout);
        context.clock = now + 2000;
        state = (0, skill_1.refreshSkillState)(context, state);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("idle");
        expect(completeCooldownAt.mock.calls.length).toBe(1);
    });
    test("auto-condition-disactivateSkill", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var now = Date.now();
        context.clock = now;
        // mock callback
        var canActivated = jest.fn(function (_, state, self) { return true; });
        var skill = {
            level: 1,
            name: "test-skill",
            transitionType: "auto-condition",
            state: {
                type: "not_init",
                data: undefined
            },
            propertyReader: jest.fn(),
            canActivated: canActivated,
        };
        var denco = {
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
        };
        var state = (0, user_1.initUser)(context, "test-user", [denco]);
        denco = state.formation[0];
        expect((0, denco_1.getSkill)(denco).state.type).toBe("active");
        expect(canActivated.mock.calls.length).toBe(1);
        expect((0, denco_1.getSkill)(denco).state.data).toBeUndefined();
        expect(function () { return (0, skill_1.disactivateSkill)(context, __assign(__assign({}, state), { carIndex: 0 })); }).toThrowError();
    });
    test("onHourCycle-コールバック", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var now = Date.parse("2020-01-01T12:50:00.000");
        context.clock = now;
        // mock callback
        var onHourCycle = jest.fn(function (_, state, self) { return state; });
        var skill = {
            level: 1,
            name: "test-skill",
            transitionType: "always",
            state: {
                type: "not_init",
                data: undefined
            },
            propertyReader: jest.fn(),
            onHourCycle: onHourCycle,
        };
        var denco = {
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
        };
        var state = (0, user_1.initUser)(context, "test-user", [denco]);
        // check event queue
        expect(state.queue.length).toBe(1);
        var entry = state.queue[0];
        expect(entry.type).toBe("hour_cycle");
        var date = new Date(now);
        var hour = date.getHours();
        expect(entry.time).toBe(date.setHours(hour + 1, 0, 0, 0));
        // 10分経過
        now += 600 * 1000;
        context.clock = now;
        state = (0, user_1.refreshCurrentTime)(context, state);
        expect(onHourCycle.mock.calls.length).toBe(1);
        expect(state.queue.length).toBe(1);
        entry = state.queue[0];
        expect(entry.type).toBe("hour_cycle");
        date = new Date(now);
        hour = date.getHours();
        expect(entry.time).toBe(date.setHours(hour + 1, 0, 0, 0));
    });
});
//# sourceMappingURL=skill.test.js.map