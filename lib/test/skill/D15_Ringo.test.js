"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var stationManager_1 = __importDefault(require("../..//core/stationManager"));
var skillManager_1 = __importDefault(require("../../core/skillManager"));
var dencoManager_1 = __importDefault(require("../../core/dencoManager"));
var __1 = require("../..");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
describe("りんごのスキル", function () {
    test("setup", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, stationManager_1.default.load()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, skillManager_1.default.load()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, dencoManager_1.default.load()];
                case 3:
                    _a.sent();
                    expect(stationManager_1.default.data.length).toBeGreaterThan(0);
                    expect(skillManager_1.default.map.size).toBeGreaterThan(0);
                    expect(dencoManager_1.default.data.size).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); });
    test("スキル状態", function () {
        var context = (0, __1.initContext)("test", "test", false);
        var ringo = dencoManager_1.default.getDenco(context, "15", 50);
        expect(ringo.skill.type).toBe("possess");
        var state = (0, __1.initUser)(context, "とあるマスター", [ringo]);
        context.clock = (0, moment_timezone_1.default)('2022-01-01T12:00:00+0900').valueOf();
        state = (0, __1.refreshState)(context, state);
        ringo = state.formation[0];
        var skill = (0, __1.getSkill)(ringo);
        expect(skill.state.transition).toBe("always");
        expect(skill.state.type).toBe("active");
        expect(function () { return (0, __1.activateSkill)(context, state, 0); }).toThrowError();
        expect(function () { return (0, __1.disactivateSkill)(context, state, 0); }).toThrowError();
        context.clock = (0, moment_timezone_1.default)('2022-01-01T23:00:00+0900').valueOf();
        state = (0, __1.refreshState)(context, state);
        ringo = state.formation[0];
        skill = (0, __1.getSkill)(ringo);
        expect(skill.state.transition).toBe("always");
        expect(skill.state.type).toBe("active");
    });
    test("発動なし-フットバース使用", function () {
        var context = (0, __1.initContext)("test", "test", false);
        var luna = dencoManager_1.default.getDenco(context, "3", 50, 1);
        var ringo = dencoManager_1.default.getDenco(context, "15", 50, 1);
        var defense = (0, __1.initUser)(context, "とあるマスター", [luna]);
        var offense = (0, __1.initUser)(context, "とあるマスター２", [ringo]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: luna.link[0],
            usePink: true,
        };
        var result = (0, __1.startAccess)(context, config);
        var access = result.access;
        expect(access.pinkItemSet).toBe(true);
        expect(access.pinkItemUsed).toBe(true);
        expect(access.pinkMode).toBe(true);
        expect((0, __1.hasSkillTriggered)(access.offense, ringo)).toBe(false);
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
    });
    test("発動なし-昼-守備側", function () {
        var _a, _b;
        var context = (0, __1.initContext)("test", "test", false);
        context.clock = (0, moment_timezone_1.default)('2022-01-01T12:00:00+0900').valueOf();
        var luna = dencoManager_1.default.getDenco(context, "3", 50, 1);
        var ringo = dencoManager_1.default.getDenco(context, "15", 50, 1);
        var defense = (0, __1.initUser)(context, "とあるマスター", [ringo]);
        var offense = (0, __1.initUser)(context, "とあるマスター２", [luna]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: ringo.link[0],
        };
        var access = (0, __1.startAccess)(context, config).access;
        expect(access.pinkMode).toBe(false);
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
        expect(access.defendPercent).toBe(0);
        expect(access.attackPercent).toBe(0);
        expect((0, __1.hasSkillTriggered)(access.defense, ringo)).toBe(false);
        expect((0, __1.hasSkillTriggered)(access.offense, luna)).toBe(false);
        expect(access.damageBase).toBe(156);
        var accessRingo = (0, __1.getAccessDenco)(access, "defense");
        expect(accessRingo.reboot).toBe(true);
        expect(accessRingo.hpBefore).toBe(144);
        expect(accessRingo.hpAfter).toBe(0);
        expect((_a = accessRingo.damage) === null || _a === void 0 ? void 0 : _a.value).toBe(156);
        expect((_b = accessRingo.damage) === null || _b === void 0 ? void 0 : _b.attr).toBe(true);
    });
    test("発動なし-攻撃側編成内", function () {
        var _a, _b;
        var context = (0, __1.initContext)("test", "test", false);
        context.clock = (0, moment_timezone_1.default)('2022-01-01T12:00:00+0900').valueOf();
        var luna = dencoManager_1.default.getDenco(context, "3", 50, 1);
        var ringo = dencoManager_1.default.getDenco(context, "15", 50, 1);
        var reika = dencoManager_1.default.getDenco(context, "5", 50, 1);
        var defense = (0, __1.initUser)(context, "とあるマスター", [luna]);
        var offense = (0, __1.initUser)(context, "とあるマスター２", [reika, ringo]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: luna.link[0],
        };
        var access = (0, __1.startAccess)(context, config).access;
        expect(access.pinkMode).toBe(false);
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
        expect(access.defendPercent).toBe(-30);
        expect(access.attackPercent).toBe(0);
        expect((0, __1.hasSkillTriggered)(access.offense, ringo)).toBe(false);
        expect((0, __1.hasSkillTriggered)(access.defense, luna)).toBe(true);
        expect(access.damageBase).toBe(260);
        var accessLuna = (0, __1.getAccessDenco)(access, "defense");
        expect(accessLuna.reboot).toBe(true);
        expect(accessLuna.hpBefore).toBe(240);
        expect(accessLuna.hpAfter).toBe(0);
        expect((_a = accessLuna.damage) === null || _a === void 0 ? void 0 : _a.value).toBe(260);
        expect((_b = accessLuna.damage) === null || _b === void 0 ? void 0 : _b.attr).toBe(false);
    });
    test("発動あり-夜-守備側", function () {
        var _a, _b;
        var context = (0, __1.initContext)("test", "test", false);
        context.clock = (0, moment_timezone_1.default)('2022-01-01T23:00:00+0900').valueOf();
        var luna = dencoManager_1.default.getDenco(context, "3", 50, 1);
        var ringo = dencoManager_1.default.getDenco(context, "15", 50, 1);
        var defense = (0, __1.initUser)(context, "とあるマスター", [ringo]);
        var offense = (0, __1.initUser)(context, "とあるマスター２", [luna]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: ringo.link[0],
        };
        var access = (0, __1.startAccess)(context, config).access;
        expect(access.pinkMode).toBe(false);
        expect((0, __1.hasSkillTriggered)(access.defense, ringo)).toBe(true);
        expect((0, __1.hasSkillTriggered)(access.offense, luna)).toBe(false);
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
        expect(access.defendPercent).toBe(-30);
        expect(access.attackPercent).toBe(0);
        var accessRingo = (0, __1.getAccessDenco)(access, "defense");
        expect(accessRingo.reboot).toBe(true);
        expect(accessRingo.hpBefore).toBe(144);
        expect(accessRingo.hpAfter).toBe(0);
        expect((_a = accessRingo.damage) === null || _a === void 0 ? void 0 : _a.value).toBe(202);
        expect((_b = accessRingo.damage) === null || _b === void 0 ? void 0 : _b.attr).toBe(true);
    });
    test("発動あり-昼-攻撃側", function () {
        var _a, _b;
        var context = (0, __1.initContext)("test", "test", false);
        context.clock = (0, moment_timezone_1.default)('2022-01-01T12:00:00+0900').valueOf();
        var luna = dencoManager_1.default.getDenco(context, "3", 50, 1);
        var ringo = dencoManager_1.default.getDenco(context, "15", 50, 1);
        var defense = (0, __1.initUser)(context, "とあるマスター", [luna]);
        var offense = (0, __1.initUser)(context, "とあるマスター２", [ringo]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: luna.link[0],
        };
        var access = (0, __1.startAccess)(context, config).access;
        expect(access.pinkMode).toBe(false);
        expect((0, __1.hasSkillTriggered)(access.offense, ringo)).toBe(true);
        expect((0, __1.hasSkillTriggered)(access.defense, luna)).toBe(true);
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
        expect(access.defendPercent).toBe(-30);
        expect(access.attackPercent).toBe(23);
        var accessLuna = (0, __1.getAccessDenco)(access, "defense");
        expect(accessLuna.reboot).toBe(true);
        expect(accessLuna.hpBefore).toBe(240);
        expect(accessLuna.hpAfter).toBe(0);
        expect((_a = accessLuna.damage) === null || _a === void 0 ? void 0 : _a.value).toBe(306);
        expect((_b = accessLuna.damage) === null || _b === void 0 ? void 0 : _b.attr).toBe(false);
    });
    test("発動なし-夜-攻撃側", function () {
        var _a, _b;
        var context = (0, __1.initContext)("test", "test", false);
        context.clock = (0, moment_timezone_1.default)('2022-01-01T23:00:00+0900').valueOf();
        var luna = dencoManager_1.default.getDenco(context, "3", 50, 1);
        var ringo = dencoManager_1.default.getDenco(context, "15", 50, 1);
        var defense = (0, __1.initUser)(context, "とあるマスター", [luna]);
        var offense = (0, __1.initUser)(context, "とあるマスター２", [ringo]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: luna.link[0],
        };
        var access = (0, __1.startAccess)(context, config).access;
        expect(access.pinkMode).toBe(false);
        expect((0, __1.hasSkillTriggered)(access.offense, ringo)).toBe(false);
        expect((0, __1.hasSkillTriggered)(access.defense, luna)).toBe(true);
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
        expect(access.defendPercent).toBe(25);
        expect(access.attackPercent).toBe(0);
        var accessLuna = (0, __1.getAccessDenco)(access, "defense");
        expect(accessLuna.reboot).toBe(false);
        expect(accessLuna.hpBefore).toBe(240);
        expect(accessLuna.hpAfter).toBe(90);
        expect((_a = accessLuna.damage) === null || _a === void 0 ? void 0 : _a.value).toBe(150);
        expect((_b = accessLuna.damage) === null || _b === void 0 ? void 0 : _b.attr).toBe(false);
    });
});
//# sourceMappingURL=D15_Ringo.test.js.map