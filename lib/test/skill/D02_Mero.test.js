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
var context_1 = require("../../core/context");
var user_1 = require("../../core/user");
var skill_1 = require("../../core/skill");
var denco_1 = require("../../core/denco");
var access_1 = require("../../core/access");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
describe("メロのスキル", function () {
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
        var context = (0, context_1.initContext)("test", "test", false);
        var mero = dencoManager_1.default.getDenco(context, "2", 50);
        expect(mero.skillHolder.type).toBe("possess");
        var state = (0, user_1.initUser)(context, "とあるマスター", [mero]);
        var now = (0, moment_timezone_1.default)().valueOf();
        context.clock = now;
        state = (0, skill_1.refreshSkillState)(context, state);
        mero = state.formation[0];
        var skill = (0, denco_1.getSkill)(mero);
        expect(skill.transitionType).toBe("always");
        expect(skill.state.type).toBe("active");
        expect(function () { return (0, skill_1.activateSkill)(context, __assign(__assign({}, state), { carIndex: 0 })); }).toThrowError();
        expect(function () { return (0, skill_1.disactivateSkill)(context, __assign(__assign({}, state), { carIndex: 0 })); }).toThrowError();
        context.clock = now + 600 * 1000;
        state = (0, skill_1.refreshSkillState)(context, state);
        mero = state.formation[0];
        skill = (0, denco_1.getSkill)(mero);
        expect(skill.transitionType).toBe("always");
        expect(skill.state.type).toBe("active");
    });
    test("発動なし-フットバース使用", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var mero = dencoManager_1.default.getDenco(context, "2", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50, 1);
        var defense = (0, user_1.initUser)(context, "とあるマスター", [reika]);
        var offense = (0, user_1.initUser)(context, "とあるマスター２", [mero]);
        var config = {
            offense: __assign({ carIndex: 0 }, offense),
            defense: __assign({ carIndex: 0 }, defense),
            station: reika.link[0],
            usePink: true,
        };
        var result = (0, access_1.startAccess)(context, config);
        var access = result.access;
        expect(access.pinkItemSet).toBe(true);
        expect(access.pinkItemUsed).toBe(true);
        expect(access.pinkMode).toBe(true);
        expect(access.offense.triggeredSkills.length).toBe(0);
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
        var accessReika = (0, access_1.getAccessDenco)(access, "defense");
        expect(accessReika.reboot).toBe(false);
    });
    test("発動なし-確率", function () {
        var _a;
        var context = (0, context_1.initContext)("test", "test", false);
        context.random.mode = "ignore";
        var mero = dencoManager_1.default.getDenco(context, "2", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50, 1);
        var defense = (0, user_1.initUser)(context, "とあるマスター", [reika]);
        var offense = (0, user_1.initUser)(context, "とあるマスター２", [mero]);
        var config = {
            offense: __assign({ carIndex: 0 }, offense),
            defense: __assign({ carIndex: 0 }, defense),
            station: reika.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        var access = result.access;
        expect(access.pinkItemSet).toBe(false);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.pinkMode).toBe(false);
        expect(access.offense.triggeredSkills.length).toBe(0);
        if (access.defense) {
            var d = (0, access_1.getAccessDenco)(access, "defense");
            expect((_a = d.damage) === null || _a === void 0 ? void 0 : _a.value).toBe(200);
            expect(d.hpBefore).toBe(192);
            expect(d.hpAfter).toBe(0);
            expect(d.reboot).toBe(true);
        }
    });
    test("発動あり", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        context.random.mode = "force";
        var mero = dencoManager_1.default.getDenco(context, "2", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50, 1);
        var defense = (0, user_1.initUser)(context, "とあるマスター", [reika]);
        var offense = (0, user_1.initUser)(context, "とあるマスター２", [mero]);
        var config = {
            offense: __assign({ carIndex: 0 }, offense),
            defense: __assign({ carIndex: 0 }, defense),
            station: reika.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        var access = result.access;
        expect(access.pinkItemSet).toBe(false);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.pinkMode).toBe(true);
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
        expect(access.offense.triggeredSkills.length).toBe(1);
        var trigger = access.offense.triggeredSkills[0];
        expect(trigger.step).toBe("pink_check");
        expect(trigger.numbering).toBe("2");
        expect(trigger.name).toBe("mero");
        if (access.defense) {
            var accessReika = (0, access_1.getAccessDenco)(access, "defense");
            expect(accessReika.reboot).toBe(false);
            expect(accessReika.damage).toBeUndefined();
        }
    });
    test("発動あり-確率ブースト", function () {
        var _a;
        var context = (0, context_1.initContext)("test", "test", false);
        context.random.mode = "force";
        var mero = dencoManager_1.default.getDenco(context, "2", 50);
        var hiiru = dencoManager_1.default.getDenco(context, "34", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50, 1);
        var defense = (0, user_1.initUser)(context, "とあるマスター", [reika]);
        var offense = (0, user_1.initUser)(context, "とあるマスター２", [mero, hiiru]);
        offense = (0, skill_1.activateSkill)(context, __assign(__assign({}, offense), { carIndex: 1 }));
        hiiru = offense.formation[1];
        expect((_a = hiiru.skillHolder.skill) === null || _a === void 0 ? void 0 : _a.state.type).toBe("active");
        var config = {
            offense: __assign({ carIndex: 0 }, offense),
            defense: __assign({ carIndex: 0 }, defense),
            station: reika.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        var access = result.access;
        expect(access.pinkItemSet).toBe(false);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.pinkMode).toBe(true);
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
        expect(access.offense.triggeredSkills.length).toBe(1);
        // メロ本人 ひいるの確率ブーストは乗らない
        var trigger = access.offense.triggeredSkills[0];
        expect(trigger.step).toBe("pink_check");
        expect(trigger.numbering).toBe("2");
        expect(trigger.name).toBe("mero");
        if (access.defense) {
            var accessReika = (0, access_1.getAccessDenco)(access, "defense");
            expect(accessReika.reboot).toBe(false);
            expect(accessReika.damage).toBeUndefined();
        }
    });
});
//# sourceMappingURL=D02_Mero.test.js.map