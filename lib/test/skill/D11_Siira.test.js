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
describe("しいらのスキル", function () {
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
        var siira = dencoManager_1.default.getDenco(context, "11", 50);
        var state = (0, __1.initUser)(context, "master", [siira]);
        siira = state.formation[0];
        expect(siira.name).toBe("siira");
        expect(siira.skill.type).toBe("possess");
        var skill = (0, __1.getSkill)(siira);
        expect(skill.state.transition).toBe("always");
        expect(skill.state.type).toBe("active");
        expect(function () { return (0, __1.activateSkill)(context, state, 0); }).toThrowError();
        expect(function () { return (0, __1.disactivateSkill)(context, state, 0); }).toThrowError();
    });
    test("発動なし-攻撃側", function () {
        var context = (0, __1.initContext)("test", "test", false);
        var siira = dencoManager_1.default.getDenco(context, "11", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50, 1);
        var offense = (0, __1.initUser)(context, "とあるマスター", [siira]);
        var defense = (0, __1.initUser)(context, "とあるマスター２", [reika]);
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
        var access = (0, __1.startAccess)(context, config).access;
        expect(access.offense.triggeredSkills.length).toBe(0);
    });
    test("発動なし-自身以外が被アクセス", function () {
        var context = (0, __1.initContext)("test", "test", false);
        var siira = dencoManager_1.default.getDenco(context, "11", 50);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, __1.initUser)(context, "とあるマスター", [reika]);
        var defense = (0, __1.initUser)(context, "とあるマスター２", [charlotte, siira]);
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
        expect(access.defense).not.toBeUndefined();
        if (access.defense) {
            expect(access.defense.triggeredSkills.length).toBe(0);
        }
    });
    test("発動なし-確率", function () {
        var _a, _b, _c;
        var context = (0, __1.initContext)("test", "test", false);
        context.random.mode = "ignore";
        var siira = dencoManager_1.default.getDenco(context, "11", 50, 1);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, __1.initUser)(context, "とあるマスター", [reika]);
        var defense = (0, __1.initUser)(context, "とあるマスター２", [charlotte, siira]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 1
            },
            station: siira.link[0],
        };
        var result = (0, __1.startAccess)(context, config);
        var access = result.access;
        // 基本的なダメージの確認
        expect(access.defense).not.toBeUndefined();
        expect((_a = access.defense) === null || _a === void 0 ? void 0 : _a.triggeredSkills.length).toBe(0);
        expect(access.defendPercent).toBe(0);
        expect(access.damageBase).toBe(260);
        expect(access.damageRatio).toBe(1.3);
        if (access.defense) {
            // アクセス中の状態の確認
            var accessSiira = access.defense.formation[1];
            expect(accessSiira.damage).not.toBeUndefined();
            expect((_b = accessSiira.damage) === null || _b === void 0 ? void 0 : _b.value).toBe(260);
            expect((_c = accessSiira.damage) === null || _c === void 0 ? void 0 : _c.attr).toBe(true);
            expect(accessSiira.hpBefore).toBe(252);
            expect(accessSiira.hpAfter).toBe(0);
            expect(accessSiira.reboot).toBe(true);
            expect(accessSiira.accessEXP).toBe(0);
        }
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
        if (result.defense) {
            // リブート確認
            defense = result.defense;
            siira = defense.formation[1];
            expect(siira.currentHp).toBe(252);
            expect(defense.event.length).toBe(2);
            var event_1 = defense.event[1];
            expect(event_1.type).toBe("reboot");
            if (event_1.type === "reboot") {
                expect(siira.currentExp).toBe(0 + event_1.data.exp);
            }
        }
    });
    test("発動なし-確率-ひいる補正あり", function () {
        var context = (0, __1.initContext)("test", "test", false);
        context.random.mode = "ignore";
        var siira = dencoManager_1.default.getDenco(context, "11", 50, 1);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var hiiru = dencoManager_1.default.getDenco(context, "34", 50);
        var offense = (0, __1.initUser)(context, "とあるマスター", [reika]);
        var defense = (0, __1.initUser)(context, "とあるマスター２", [hiiru, siira]);
        defense = (0, __1.activateSkill)(context, defense, 0);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 1
            },
            station: siira.link[0],
        };
        var result = (0, __1.startAccess)(context, config);
        var access = result.access;
        // 基本的なダメージの確認
        expect(access.defense).not.toBeUndefined();
        expect(access.defendPercent).toBe(0);
        expect(access.damageBase).toBe(260);
        expect(access.damageRatio).toBe(1.3);
        if (access.defense) {
            // 確率補正の確認
            expect(access.defense.triggeredSkills.length).toBe(1);
            var tirgger = access.defense.triggeredSkills[0];
            expect(tirgger.name).toBe(hiiru.name);
            expect(tirgger.step).toBe("probability_check");
        }
        expect(access.linkDisconncted).toBe(true);
        expect(access.linkSuccess).toBe(true);
    });
    test("発動あり", function () {
        var _a, _b;
        var context = (0, __1.initContext)("test", "test", false);
        context.random.mode = "force";
        var siira = dencoManager_1.default.getDenco(context, "11", 50, 1);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, __1.initUser)(context, "とあるマスター", [reika]);
        var defense = (0, __1.initUser)(context, "とあるマスター２", [charlotte, siira]);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 1
            },
            station: siira.link[0],
        };
        var result = (0, __1.startAccess)(context, config);
        var access = result.access;
        // 基本的なダメージの確認
        expect(access.defense).not.toBeUndefined();
        expect(access.defendPercent).toBe(25);
        expect(access.damageBase).toBe(195);
        expect(access.damageRatio).toBe(1.3);
        if (access.defense) {
            // アクセス中の状態の確認
            expect(access.defense.triggeredSkills.length).toBe(1);
            var tirgger = access.defense.triggeredSkills[0];
            expect(tirgger.name).toBe(siira.name);
            expect(tirgger.step).toBe("damage_common");
            var accessSiira = access.defense.formation[1];
            expect(accessSiira.damage).not.toBeUndefined();
            expect((_a = accessSiira.damage) === null || _a === void 0 ? void 0 : _a.value).toBe(195);
            expect((_b = accessSiira.damage) === null || _b === void 0 ? void 0 : _b.attr).toBe(true);
            expect(accessSiira.hpBefore).toBe(252);
            expect(accessSiira.hpAfter).toBe(57);
            expect(accessSiira.reboot).toBe(false);
            expect(accessSiira.accessEXP).toBe(0);
        }
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
    });
    test("発動あり-確率補正あり", function () {
        var context = (0, __1.initContext)("test", "test", false);
        context.random.mode = "force";
        var siira = dencoManager_1.default.getDenco(context, "11", 50, 1);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var hiiru = dencoManager_1.default.getDenco(context, "34", 50);
        var offense = (0, __1.initUser)(context, "とあるマスター", [reika]);
        var defense = (0, __1.initUser)(context, "とあるマスター２", [hiiru, siira]);
        defense = (0, __1.activateSkill)(context, defense, 0);
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            defense: {
                state: defense,
                carIndex: 1
            },
            station: siira.link[0],
        };
        var result = (0, __1.startAccess)(context, config);
        var access = result.access;
        // 基本的なダメージの確認
        expect(access.defense).not.toBeUndefined();
        expect(access.defendPercent).toBe(25);
        expect(access.damageBase).toBe(195);
        expect(access.damageRatio).toBe(1.3);
        if (access.defense) {
            // アクセス中の状態の確認
            expect(access.defense.triggeredSkills.length).toBe(2);
            var tirgger = access.defense.triggeredSkills[0];
            expect(tirgger.name).toBe(hiiru.name);
            expect(tirgger.step).toBe("probability_check");
            tirgger = access.defense.triggeredSkills[1];
            expect(tirgger.name).toBe(siira.name);
            expect(tirgger.step).toBe("damage_common");
        }
        expect(access.linkDisconncted).toBe(false);
        expect(access.linkSuccess).toBe(false);
    });
});
//# sourceMappingURL=D11_Siira.test.js.map