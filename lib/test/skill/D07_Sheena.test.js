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
describe("シーナのスキル", function () {
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
        var sheena = dencoManager_1.default.getDenco(context, "7", 1);
        expect(sheena.skill.type).toBe("not_acquired");
        sheena = dencoManager_1.default.getDenco(context, "7", 50);
        expect(sheena.skill.type).toBe("possess");
        var state = (0, user_1.initUser)(context, "とあるマスター", [sheena]);
        sheena = state.formation[0];
        var skill = (0, skill_1.getSkill)(sheena);
        expect(skill.state.type).toBe("active");
        expect(skill.state.transition).toBe("always");
        expect(function () { return (0, skill_1.activateSkill)(context, state, 0); }).toThrowError();
        expect(function () { return (0, skill_1.disactivateSkill)(context, state, 0); }).toThrowError();
    });
    test("発動なし-攻撃側", function () {
        var _a, _b, _c;
        var context = (0, context_1.initContext)("test", "test", false);
        context.random.mode = "force";
        var sheena = dencoManager_1.default.getDenco(context, "7", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            sheena
        ]);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [
            charlotte
        ]);
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
        expect(result.offense.event.length).toBe(1);
        expect(result.defense).not.toBeUndefined();
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(1);
        var access = result.access;
        // 発動なし
        expect(access.offense.triggeredSkills.length).toBe(0);
        // ダメージ計算
        var d = (0, access_1.getAccessDenco)(access, "defense");
        expect((_b = d.damage) === null || _b === void 0 ? void 0 : _b.value).toBe(208);
        expect((_c = d.damage) === null || _c === void 0 ? void 0 : _c.attr).toBe(true);
        expect(d.hpBefore).toBe(228);
        expect(d.hpAfter).toBe(20);
        expect(d.reboot).toBe(false);
        expect(d.currentHp).toBe(20);
        // リンク結果
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
        // 経験値
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP);
        d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP);
    });
    test("発動なし-守備側-確率", function () {
        var _a, _b, _c, _d;
        var context = (0, context_1.initContext)("test", "test", false);
        context.random.mode = "ignore";
        var sheena = dencoManager_1.default.getDenco(context, "7", 50, 1);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            charlotte
        ]);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [
            sheena
        ]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: sheena.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.defense).not.toBeUndefined();
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(1);
        var access = result.access;
        // 発動なし
        expect((_b = access.defense) === null || _b === void 0 ? void 0 : _b.triggeredSkills.length).toBe(0);
        // ダメージ計算
        var d = (0, access_1.getAccessDenco)(access, "defense");
        expect((_c = d.damage) === null || _c === void 0 ? void 0 : _c.value).toBe(170);
        expect((_d = d.damage) === null || _d === void 0 ? void 0 : _d.attr).toBe(false);
        expect(d.hpBefore).toBe(264);
        expect(d.hpAfter).toBe(94);
        expect(d.reboot).toBe(false);
        expect(d.currentHp).toBe(94);
        // リンク結果
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
        // 経験値
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP);
        d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP);
    });
    test("発動なし-守備側-リブート", function () {
        var _a, _b, _c;
        var context = (0, context_1.initContext)("test", "test", false);
        context.random.mode = "force";
        var sheena = dencoManager_1.default.getDenco(context, "7", 50, 1);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 80);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            charlotte
        ]);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [
            sheena
        ]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: sheena.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.defense).not.toBeUndefined();
        if (result.defense) {
            expect(result.defense.event.length).toBe(2);
            expect(result.defense.event[0].type).toBe("access");
            expect(result.defense.event[1].type).toBe("reboot");
        }
        var access = result.access;
        // 発動なし
        expect((_a = access.defense) === null || _a === void 0 ? void 0 : _a.triggeredSkills.length).toBe(0);
        // ダメージ計算
        var d = (0, access_1.getAccessDenco)(access, "defense");
        expect((_b = d.damage) === null || _b === void 0 ? void 0 : _b.value).toBe(270);
        expect((_c = d.damage) === null || _c === void 0 ? void 0 : _c.attr).toBe(false);
        expect(d.hpBefore).toBe(264);
        expect(d.hpAfter).toBe(0);
        expect(d.reboot).toBe(true);
        expect(d.currentHp).toBe(264);
        // リンク結果
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
        // 経験値
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP);
        d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP);
    });
    test("発動あり-守備側", function () {
        var _a, _b, _c, _d, _e;
        var context = (0, context_1.initContext)("test", "test", false);
        context.random.mode = "force";
        var sheena = dencoManager_1.default.getDenco(context, "7", 50, 1);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            charlotte
        ]);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [
            sheena
        ]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: sheena.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.defense).not.toBeUndefined();
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(1);
        var access = result.access;
        // 発動あり
        var side = (0, access_1.getDefense)(access);
        expect(side.triggeredSkills.length).toBe(1);
        expect(side.triggeredSkills[0].name).toBe("sheena");
        expect(side.triggeredSkills[0].step).toBe("after_damage");
        side = access.offense;
        expect(side.triggeredSkills.length).toBe(0);
        // ダメージ計算
        var d = (0, access_1.getAccessDenco)(access, "defense");
        expect((_b = d.damage) === null || _b === void 0 ? void 0 : _b.value).toBe(170);
        expect((_c = d.damage) === null || _c === void 0 ? void 0 : _c.attr).toBe(false);
        expect(d.hpBefore).toBe(264);
        expect(d.hpAfter).toBe(94);
        expect(d.reboot).toBe(false);
        expect(d.currentHp).toBe(94);
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect((_d = d.damage) === null || _d === void 0 ? void 0 : _d.value).toBe(208);
        expect((_e = d.damage) === null || _e === void 0 ? void 0 : _e.attr).toBe(true);
        expect(d.hpBefore).toBe(228);
        expect(d.hpAfter).toBe(20);
        expect(d.reboot).toBe(false);
        expect(d.currentHp).toBe(20);
        // リンク結果
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
        // 経験値
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP);
        d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.accessEXP).toBeGreaterThan(0);
        expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP);
    });
    test("発動あり-守備側-ATK/DEF増減", function () {
        var _a, _b, _c, _d, _e;
        var context = (0, context_1.initContext)("test", "test", false);
        context.random.mode = "force";
        var sheena = dencoManager_1.default.getDenco(context, "7", 50, 1);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50);
        var fubu = dencoManager_1.default.getDenco(context, "14", 50);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            charlotte, fubu
        ]);
        offense = (0, skill_1.activateSkill)(context, offense, 1);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [
            sheena, reika
        ]);
        defense = (0, skill_1.activateSkill)(context, defense, 1);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: sheena.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.defense).not.toBeUndefined();
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(1);
        var access = result.access;
        // 発動あり
        var side = (0, access_1.getDefense)(access);
        expect(side.triggeredSkills.length).toBe(2);
        expect(side.triggeredSkills[0].name).toBe("sheena");
        expect(side.triggeredSkills[0].step).toBe("after_damage");
        expect(side.triggeredSkills[1].name).toBe("reika");
        expect(side.triggeredSkills[1].step).toBe("damage_common");
        side = access.offense;
        expect(side.triggeredSkills.length).toBe(1);
        expect(side.triggeredSkills[0].name).toBe("fubu");
        expect(side.triggeredSkills[0].step).toBe("damage_common");
        // ダメージ計算
        var d = (0, access_1.getAccessDenco)(access, "defense");
        expect((_b = d.damage) === null || _b === void 0 ? void 0 : _b.value).toBe(170);
        expect((_c = d.damage) === null || _c === void 0 ? void 0 : _c.attr).toBe(false);
        expect(d.hpBefore).toBe(264);
        expect(d.hpAfter).toBe(94);
        expect(d.reboot).toBe(false);
        expect(d.currentHp).toBe(94);
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect((_d = d.damage) === null || _d === void 0 ? void 0 : _d.value).toBe(220);
        expect((_e = d.damage) === null || _e === void 0 ? void 0 : _e.attr).toBe(true);
        expect(d.hpBefore).toBe(228);
        expect(d.hpAfter).toBe(8);
        expect(d.reboot).toBe(false);
        expect(d.currentHp).toBe(8);
        // リンク結果
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
        // 経験値
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP);
        d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.accessEXP).toBeGreaterThan(0);
        expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP);
    });
    test("発動あり-守備側-ひいる", function () {
        var _a, _b, _c, _d, _e;
        var context = (0, context_1.initContext)("test", "test", false);
        context.random.mode = "force";
        var sheena = dencoManager_1.default.getDenco(context, "7", 50, 1);
        var hiiru = dencoManager_1.default.getDenco(context, "34", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            charlotte
        ]);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [
            sheena, hiiru
        ]);
        defense = (0, skill_1.activateSkill)(context, defense, 1);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: sheena.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.defense).not.toBeUndefined();
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(1);
        var access = result.access;
        // 発動あり
        var side = (0, access_1.getDefense)(access);
        expect(side.triggeredSkills.length).toBe(2);
        expect(side.triggeredSkills[0].name).toBe("hiiru");
        expect(side.triggeredSkills[0].step).toBe("probability_check");
        expect(side.triggeredSkills[1].name).toBe("sheena");
        expect(side.triggeredSkills[1].step).toBe("after_damage");
        side = access.offense;
        expect(side.triggeredSkills.length).toBe(0);
        // ダメージ計算
        var d = (0, access_1.getAccessDenco)(access, "defense");
        expect((_b = d.damage) === null || _b === void 0 ? void 0 : _b.value).toBe(170);
        expect((_c = d.damage) === null || _c === void 0 ? void 0 : _c.attr).toBe(false);
        expect(d.hpBefore).toBe(264);
        expect(d.hpAfter).toBe(94);
        expect(d.reboot).toBe(false);
        expect(d.currentHp).toBe(94);
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect((_d = d.damage) === null || _d === void 0 ? void 0 : _d.value).toBe(208);
        expect((_e = d.damage) === null || _e === void 0 ? void 0 : _e.attr).toBe(true);
        expect(d.hpBefore).toBe(228);
        expect(d.hpAfter).toBe(20);
        expect(d.reboot).toBe(false);
        expect(d.currentHp).toBe(20);
        // リンク結果
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
        // 経験値
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP);
        d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.accessEXP).toBeGreaterThan(0);
        expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP);
    });
    test("発動なし-守備側-確率", function () {
        var _a, _b, _c, _d, _e, _f;
        var context = (0, context_1.initContext)("test", "test", false);
        context.random.mode = "ignore";
        var sheena = dencoManager_1.default.getDenco(context, "7", 50, 1);
        var hiiru = dencoManager_1.default.getDenco(context, "34", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            charlotte
        ]);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [
            sheena, hiiru
        ]);
        defense = (0, skill_1.activateSkill)(context, defense, 1);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 0
            },
            station: sheena.link[0],
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.defense).not.toBeUndefined();
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(1);
        var access = result.access;
        // 発動なし ただし確率補正は発動
        expect((_b = access.defense) === null || _b === void 0 ? void 0 : _b.triggeredSkills.length).toBe(1);
        expect((_c = access.defense) === null || _c === void 0 ? void 0 : _c.triggeredSkills[0].name).toBe("hiiru");
        expect((_d = access.defense) === null || _d === void 0 ? void 0 : _d.triggeredSkills[0].step).toBe("probability_check");
        // ダメージ計算
        var d = (0, access_1.getAccessDenco)(access, "defense");
        expect((_e = d.damage) === null || _e === void 0 ? void 0 : _e.value).toBe(170);
        expect((_f = d.damage) === null || _f === void 0 ? void 0 : _f.attr).toBe(false);
        expect(d.hpBefore).toBe(264);
        expect(d.hpAfter).toBe(94);
        expect(d.reboot).toBe(false);
        expect(d.currentHp).toBe(94);
        // リンク結果
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
        // 経験値
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP);
        d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.currentExp).toBe(sheena.currentExp + d.accessEXP);
    });
});
//# sourceMappingURL=D07_Sheena.test.js.map