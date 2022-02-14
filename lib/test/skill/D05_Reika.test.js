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
var context_1 = require("../../core/context");
var user_1 = require("../../core/user");
var skill_1 = require("../../core/skill");
var access_1 = require("../../core/access");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
describe("レイカのスキル", function () {
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
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        expect(reika.skill.type).toBe("possess");
        var defense = (0, user_1.initUser)(context, "とあるマスター", [reika]);
        var now = (0, moment_timezone_1.default)().valueOf();
        context.clock = now;
        defense = (0, skill_1.refreshSkillState)(context, defense);
        reika = defense.formation[0];
        expect(reika.name).toBe("reika");
        var skill = (0, skill_1.getSkill)(reika);
        expect(skill.state.transition).toBe("manual");
        expect(skill.state.type).toBe("idle");
        defense = (0, skill_1.activateSkill)(context, defense, 0);
        reika = defense.formation[0];
        skill = (0, skill_1.getSkill)(reika);
        expect(skill.state.type).toBe("active");
        expect(skill.state.data).not.toBeUndefined();
        var data = skill.state.data;
        expect(data.activeTimeout).toBe(now + 900 * 1000);
        expect(data.cooldownTimeout).toBe(now + 900 * 1000 + 5400 * 1000);
        // 10分経過
        context.clock = now + 600 * 1000;
        defense = (0, skill_1.refreshSkillState)(context, defense);
        reika = defense.formation[0];
        skill = (0, skill_1.getSkill)(reika);
        expect(skill.state.type).toBe("active");
        // 15分経過
        context.clock = now + 900 * 1000;
        defense = (0, skill_1.refreshSkillState)(context, defense);
        reika = defense.formation[0];
        skill = (0, skill_1.getSkill)(reika);
        expect(skill.state.type).toBe("cooldown");
        var timeout = skill.state.data;
        expect(timeout.cooldownTimeout).toBe(now + (900 + 5400) * 1000);
        // 1時間45分経過
        context.clock = now + (900 + 5400) * 1000;
        defense = (0, skill_1.refreshSkillState)(context, defense);
        reika = defense.formation[0];
        skill = (0, skill_1.getSkill)(reika);
        expect(skill.state.type).toBe("idle");
    });
    test("発動なし-非アクティブ", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var seria = dencoManager_1.default.getDenco(context, "1", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, user_1.initUser)(context, "とあるマスター", [reika, seria]);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [charlotte]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: charlotte.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.defense).not.toBeUndefined();
        expect((0, access_1.hasSkillTriggered)(result.access.offense, reika)).toBe(false);
        expect(result.access.attackPercent).toBe(0);
    });
    test("発動なし-守備側", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var seria = dencoManager_1.default.getDenco(context, "1", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50, 1);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50);
        var defense = (0, user_1.initUser)(context, "とあるマスター", [reika, seria]);
        defense = (0, skill_1.activateSkill)(context, defense, 0);
        reika = defense.formation[0];
        expect((0, skill_1.isSkillActive)(reika.skill)).toBe(true);
        var offense = (0, user_1.initUser)(context, "とあるマスター２", [charlotte]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: reika.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.defense).not.toBeUndefined();
        expect((0, access_1.hasSkillTriggered)(result.access.defense, reika)).toBe(false);
        expect(result.access.attackPercent).toBe(0);
    });
    test("発動あり-攻撃側", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var seria = dencoManager_1.default.getDenco(context, "1", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, user_1.initUser)(context, "とあるマスター", [reika, seria]);
        offense = (0, skill_1.activateSkill)(context, offense, 0);
        reika = offense.formation[0];
        expect((0, skill_1.isSkillActive)(reika.skill)).toBe(true);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [charlotte]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: charlotte.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.defense).not.toBeUndefined();
        expect((0, access_1.hasSkillTriggered)(result.access.offense, reika)).toBe(true);
        expect(result.access.attackPercent).toBe(25);
    });
    test("発動あり-確率ブースト", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var hiiru = dencoManager_1.default.getDenco(context, "34", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, user_1.initUser)(context, "とあるマスター", [reika, hiiru]);
        offense = (0, skill_1.activateSkill)(context, offense, 0);
        reika = offense.formation[0];
        expect((0, skill_1.isSkillActive)(reika.skill)).toBe(true);
        offense = (0, skill_1.activateSkill)(context, offense, 1);
        hiiru = offense.formation[1];
        expect((0, skill_1.isSkillActive)(hiiru.skill)).toBe(true);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [charlotte]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: charlotte.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.defense).not.toBeUndefined();
        expect((0, access_1.hasSkillTriggered)(result.access.offense, reika)).toBe(true);
        expect((0, access_1.hasSkillTriggered)(result.access.offense, hiiru)).toBe(false);
        expect(result.access.attackPercent).toBe(25);
    });
    test("発動あり-編成内", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var seria = dencoManager_1.default.getDenco(context, "1", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, user_1.initUser)(context, "とあるマスター", [reika, seria]);
        offense = (0, skill_1.activateSkill)(context, offense, 0);
        reika = offense.formation[0];
        expect((0, skill_1.isSkillActive)(reika.skill)).toBe(true);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [charlotte]);
        var config = {
            offense: {
                state: offense,
                carIndex: 1
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: charlotte.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.defense).not.toBeUndefined();
        expect((0, access_1.hasSkillTriggered)(result.access.offense, reika)).toBe(true);
        expect(result.access.attackPercent).toBe(25);
        var accessSeria = (0, access_1.getAccessDenco)(result.access, "offense");
        expect(accessSeria.name).toBe("seria");
    });
});
//# sourceMappingURL=D05_Reika.test.js.map