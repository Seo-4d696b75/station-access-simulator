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
var moment_timezone_1 = __importDefault(require("moment-timezone"));
var __1 = require("../..");
describe("ふぶのスキル", function () {
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
        var fubu = dencoManager_1.default.getDenco(context, "14", 50);
        expect(fubu.skill.type).toBe("possess");
        var defense = (0, __1.initUser)(context, "とあるマスター", [fubu]);
        var now = (0, moment_timezone_1.default)().valueOf();
        context.clock = now;
        fubu = defense.formation[0];
        expect(fubu.name).toBe("fubu");
        var skill = (0, __1.getSkill)(fubu);
        expect(skill.state.transition).toBe("manual");
        expect(skill.state.type).toBe("idle");
        expect(function () { return (0, __1.disactivateSkill)(context, defense, 0); }).toThrowError();
        defense = (0, __1.activateSkill)(context, defense, 0);
        fubu = defense.formation[0];
        skill = (0, __1.getSkill)(fubu);
        expect(skill.state.type).toBe("active");
        expect(skill.state.transition).toBe("manual");
        expect(skill.state.data).not.toBeUndefined();
        if (skill.state.type === "active" && skill.state.transition === "manual" && skill.state.data) {
            var data = skill.state.data;
            expect(data.activeTimeout).toBe(now + 1800 * 1000);
            expect(data.cooldownTimeout).toBe(now + 1800 * 1000 + 7200 * 1000);
        }
        expect(function () { return (0, __1.disactivateSkill)(context, defense, 0); }).toThrowError();
        // 10分経過
        context.clock = now + 600 * 1000;
        defense = (0, __1.refreshState)(context, defense);
        fubu = defense.formation[0];
        skill = (0, __1.getSkill)(fubu);
        expect(skill.state.type).toBe("active");
        // 30分経過
        context.clock = now + 1800 * 1000;
        defense = (0, __1.refreshState)(context, defense);
        fubu = defense.formation[0];
        skill = (0, __1.getSkill)(fubu);
        expect(skill.state.type).toBe("cooldown");
        expect(skill.state.transition).toBe("manual");
        if (skill.state.type === "cooldown" && skill.state.transition === "manual") {
            var timeout = skill.state.data;
            expect(timeout.cooldownTimeout).toBe(now + (1800 + 7200) * 1000);
        }
        // 30分 + 2時間経過
        context.clock = now + (1800 + 7200) * 1000;
        defense = (0, __1.refreshState)(context, defense);
        fubu = defense.formation[0];
        skill = (0, __1.getSkill)(fubu);
        expect(skill.state.type).toBe("idle");
    });
    test("発動なし-非アクティブ", function () {
        var context = (0, __1.initContext)("test", "test", false);
        var fubu = dencoManager_1.default.getDenco(context, "14", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, __1.initUser)(context, "とあるマスター", [reika]);
        var defense = (0, __1.initUser)(context, "とあるマスター２", [charlotte, fubu]);
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
        var result = (0, __1.startAccess)(context, config);
        expect(result.defense).not.toBeUndefined();
        expect((0, __1.hasSkillTriggered)(result.access.defense, fubu)).toBe(false);
        expect(result.access.defendPercent).toBe(0);
    });
    test("発動なし-攻撃側", function () {
        var context = (0, __1.initContext)("test", "test", false);
        var fubu = dencoManager_1.default.getDenco(context, "14", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50, 1);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50);
        var defense = (0, __1.initUser)(context, "とあるマスター", [reika]);
        var offense = (0, __1.initUser)(context, "とあるマスター２", [charlotte, fubu]);
        offense = (0, __1.activateSkill)(context, offense, 1);
        fubu = offense.formation[1];
        expect((0, __1.getSkill)(fubu).state.type).toBe("active");
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
        var result = (0, __1.startAccess)(context, config);
        expect(result.defense).not.toBeUndefined();
        expect((0, __1.hasSkillTriggered)(result.access.offense, fubu)).toBe(false);
        expect(result.access.defendPercent).toBe(0);
    });
    test("発動あり-守備側", function () {
        var _a, _b;
        var context = (0, __1.initContext)("test", "test", false);
        var fubu = dencoManager_1.default.getDenco(context, "14", 50, 1);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var offense = (0, __1.initUser)(context, "とあるマスター", [reika]);
        var defense = (0, __1.initUser)(context, "とあるマスター２", [fubu]);
        defense = (0, __1.activateSkill)(context, defense, 0);
        fubu = defense.formation[0];
        expect((0, __1.getSkill)(fubu).state.type).toBe("active");
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: fubu.link[0],
        };
        var access = (0, __1.startAccess)(context, config).access;
        // 基本的なダメージの確認
        expect(access.defense).not.toBeUndefined();
        expect((0, __1.hasSkillTriggered)(access.defense, fubu)).toBe(true);
        expect(access.defendPercent).toBe(19);
        expect(access.damageBase).toBe(162);
        expect(access.damageRatio).toBe(1.0);
        if (access.defense) {
            // アクセス中の状態の確認
            var accessFubu = access.defense.formation[0];
            expect(accessFubu.damage).not.toBeUndefined();
            expect((_a = accessFubu.damage) === null || _a === void 0 ? void 0 : _a.value).toBe(162);
            expect((_b = accessFubu.damage) === null || _b === void 0 ? void 0 : _b.attr).toBe(false);
            expect(accessFubu.hpBefore).toBe(228);
            expect(accessFubu.hpAfter).toBe(66);
            expect(accessFubu.reboot).toBe(false);
            expect(accessFubu.accessEXP).toBe(0);
        }
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
    });
    test("発動あり-守備側編成内", function () {
        var _a, _b;
        var context = (0, __1.initContext)("test", "test", false);
        var fubu = dencoManager_1.default.getDenco(context, "14", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, __1.initUser)(context, "とあるマスター", [reika]);
        var defense = (0, __1.initUser)(context, "とあるマスター２", [charlotte, fubu]);
        defense = (0, __1.activateSkill)(context, defense, 1);
        fubu = defense.formation[1];
        expect((0, __1.getSkill)(fubu).state.type).toBe("active");
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
        var access = (0, __1.startAccess)(context, config).access;
        // 基本的なダメージの確認
        expect(access.defense).not.toBeUndefined();
        expect((0, __1.hasSkillTriggered)(access.defense, fubu)).toBe(true);
        expect(access.defendPercent).toBe(19);
        expect(access.damageBase).toBe(210);
        expect(access.damageRatio).toBe(1.3);
        if (access.defense) {
            // アクセス中の状態の確認
            var accessCharlotte = access.defense.formation[0];
            expect(accessCharlotte.damage).not.toBeUndefined();
            expect((_a = accessCharlotte.damage) === null || _a === void 0 ? void 0 : _a.value).toBe(210);
            expect((_b = accessCharlotte.damage) === null || _b === void 0 ? void 0 : _b.attr).toBe(true);
            expect(accessCharlotte.hpBefore).toBe(228);
            expect(accessCharlotte.hpAfter).toBe(18);
            expect(accessCharlotte.reboot).toBe(false);
            expect(accessCharlotte.accessEXP).toBe(0);
        }
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
    });
    test("発動あり-確率ブースト", function () {
        var context = (0, __1.initContext)("test", "test", false);
        var fubu = dencoManager_1.default.getDenco(context, "14", 50);
        var hiiru = dencoManager_1.default.getDenco(context, "34", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, __1.initUser)(context, "とあるマスター２", [reika]);
        var defense = (0, __1.initUser)(context, "とあるマスター", [charlotte, fubu, hiiru]);
        defense = (0, __1.activateSkill)(context, defense, 1);
        defense = (0, __1.activateSkill)(context, defense, 2);
        fubu = defense.formation[1];
        hiiru = defense.formation[2];
        expect((0, __1.getSkill)(fubu).state.type).toBe("active");
        expect((0, __1.getSkill)(hiiru).state.type).toBe("active");
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
        var result = (0, __1.startAccess)(context, config);
        expect(result.defense).not.toBeUndefined();
        expect((0, __1.hasSkillTriggered)(result.access.defense, fubu)).toBe(true);
        expect((0, __1.hasSkillTriggered)(result.access.defense, hiiru)).toBe(false);
        expect(result.access.defendPercent).toBe(19);
    });
});
//# sourceMappingURL=D14_Fubu.test.js.map