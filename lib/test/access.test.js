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
var stationManager_1 = __importDefault(require("../core/stationManager"));
var skillManager_1 = __importDefault(require("../core/skillManager"));
var dencoManager_1 = __importDefault(require("../core/dencoManager"));
var context_1 = require("../core/context");
var access_1 = require("../core/access");
var user_1 = require("../core/user");
var skill_1 = require("../core/skill");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
describe("基本的なアクセス処理", function () {
    test("load", function () { return __awaiter(void 0, void 0, void 0, function () {
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
    test("守備側なし", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
        ]);
        var station = stationManager_1.default.getRandomStation(context, 1)[0];
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            station: station,
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.offense.event[0].type).toBe("access");
        expect(result.defense).toBeUndefined();
        var access = result.access;
        // 不在の確認
        expect(access.defense).toBeUndefined();
        // アクセス結果の確認
        expect(access.linkSuccess).toBe(true);
        expect(access.linkDisconncted).toBe(false);
        // アクセス処理の確認
        expect(access.pinkMode).toBe(false);
        expect(access.pinkItemSet).toBe(false);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.attackPercent).toBe(0);
        expect(access.defendPercent).toBe(0);
        expect(access.damageBase).toBeUndefined();
        expect(access.damageFixed).toBe(0);
        var d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.name).toBe(reika.name);
        expect(d.numbering).toBe(reika.numbering);
        expect(d.hpBefore).toBe(192);
        expect(d.hpAfter).toBe(192);
        expect(d.currentHp).toBe(192);
        expect(d.currentExp).toBe(reika.currentExp + d.accessEXP);
        expect(d.link.length).toBe(1);
        expect(d.link[0]).toMatchObject(station);
        expect(function () { return (0, access_1.getAccessDenco)(access, "defense"); }).toThrowError();
    });
    test("守備側なし-フットバースあり", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
        ]);
        var station = stationManager_1.default.getRandomStation(context, 1)[0];
        var config = {
            offense: {
                state: offense,
                carIndex: 0
            },
            station: station,
            usePink: true,
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.offense.event[0].type).toBe("access");
        expect(result.defense).toBeUndefined();
        var access = result.access;
        // 不在の確認
        expect(access.defense).toBeUndefined();
        // アクセス結果の確認
        expect(access.linkSuccess).toBe(true);
        expect(access.linkDisconncted).toBe(false);
        expect(access.pinkItemSet).toBe(true);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.pinkMode).toBe(false);
        reika = result.offense.formation[0];
        expect(reika.link.length).toBe(1);
        expect(reika.link[0]).toMatchObject(station);
    });
    test("守備側あり-スキル発動なし-Rebootなし", function () {
        var _a, _b, _c;
        var context = (0, context_1.initContext)("test", "test", false);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 80, 3);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
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
        // 相手の確認
        expect(access.defense).not.toBeUndefined();
        // アクセス結果の確認
        expect(access.linkSuccess).toBe(false);
        expect(access.linkDisconncted).toBe(false);
        // アクセス処理の確認
        expect(access.pinkMode).toBe(false);
        expect(access.pinkItemSet).toBe(false);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.attackPercent).toBe(0);
        expect(access.defendPercent).toBe(0);
        // ダメージ計算確認
        expect(access.damageBase).toBe(260);
        expect(access.damageFixed).toBe(0);
        var d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.name).toBe(reika.name);
        expect(d.numbering).toBe(reika.numbering);
        expect(d.hpBefore).toBe(192);
        expect(d.hpAfter).toBe(192);
        expect(d.damage).toBeUndefined();
        expect(d.currentHp).toBe(192);
        expect(d.currentExp).toBe(reika.currentExp + d.accessEXP);
        expect(d.ap).toBe(200);
        expect(d.link.length).toBe(0);
        d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.name).toBe(charlotte.name);
        expect(d.numbering).toBe(charlotte.numbering);
        expect(d.hpBefore).toBe(324);
        expect(d.hpAfter).toBe(64);
        expect((_b = d.damage) === null || _b === void 0 ? void 0 : _b.value).toBe(260);
        expect((_c = d.damage) === null || _c === void 0 ? void 0 : _c.attr).toBe(true);
        expect(d.currentHp).toBe(64);
        expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP);
        expect(d.link.length).toBe(3);
        // 最新の状態
        var reikaNow = result.offense.formation[0];
        expect(reikaNow.name).toBe("reika");
        expect(reikaNow.numbering).toBe("5");
        expect(reikaNow.currentExp).toBe(reika.currentExp + (0, access_1.getAccessDenco)(access, "offense").accessEXP);
        expect(reikaNow.currentHp).toBe(192);
        if (result.defense) {
            var charlotteNow = result.defense.formation[0];
            expect(charlotteNow.name).toBe("charlotte");
            expect(charlotteNow.numbering).toBe("6");
            expect(charlotteNow.currentExp).toBe(charlotte.currentExp + (0, access_1.getAccessDenco)(access, "defense").accessEXP);
            expect(charlotteNow.currentHp).toBe(64);
        }
    });
    test("守備側あり-フットバースあり", function () {
        var _a;
        var context = (0, context_1.initContext)("test", "test", false);
        var now = (0, moment_timezone_1.default)().valueOf();
        context.clock = now;
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 80, 3);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
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
            usePink: true,
        };
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.defense).not.toBeUndefined();
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(1);
        var access = result.access;
        // 相手の確認
        expect(access.defense).not.toBeUndefined();
        // アクセス結果の確認
        expect(access.linkSuccess).toBe(true);
        expect(access.linkDisconncted).toBe(true);
        // アクセス処理の確認
        expect(access.pinkMode).toBe(true);
        expect(access.pinkItemSet).toBe(true);
        expect(access.pinkItemUsed).toBe(true);
        // ダメージ計算確認
        expect(access.damageBase).toBeUndefined();
        expect(access.damageFixed).toBe(0);
        expect((0, access_1.getAccessDenco)(access, "offense").damage).toBeUndefined();
        expect((0, access_1.getAccessDenco)(access, "defense").damage).toBeUndefined();
        // リンク
        reika = result.offense.formation[0];
        expect(reika.link.length).toBe(1);
        expect(reika.link[0]).toMatchObject(__assign(__assign({}, charlotte.link[0]), { start: now }));
        // 最終状態の確認
        expect(result.defense).not.toBeUndefined();
        if (result.defense) {
            var charlotteResult = (0, user_1.getTargetDenco)(result.defense);
            charlotte = defense.formation[0];
            expect(charlotteResult).toMatchObject(__assign(__assign({}, charlotte), { link: charlotte.link.slice(1), currentExp: charlotte.currentExp + (0, access_1.getAccessDenco)(access, "defense").accessEXP }));
        }
    });
    test("守備側あり-スキル発動なし-Rebootあり", function () {
        var _a, _b, _c, _d;
        var context = (0, context_1.initContext)("test", "test", false);
        var now = (0, moment_timezone_1.default)().valueOf();
        context.clock = now;
        var reika = dencoManager_1.default.getDenco(context, "5", 80);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50, 1);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
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
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(2);
        var access = result.access;
        // 相手の確認
        expect(access.defense).not.toBeUndefined();
        // アクセス結果の確認
        expect(access.linkSuccess).toBe(true);
        expect(access.linkDisconncted).toBe(true);
        // アクセス処理の確認
        expect(access.pinkMode).toBe(false);
        expect(access.pinkItemSet).toBe(false);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.attackPercent).toBe(0);
        expect(access.defendPercent).toBe(0);
        // ダメージ計算確認
        expect(access.damageBase).toBe(338);
        expect(access.damageFixed).toBe(0);
        var d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.name).toBe(reika.name);
        expect(d.numbering).toBe(reika.numbering);
        expect(d.hpBefore).toBe(312);
        expect(d.hpAfter).toBe(312);
        expect(d.currentHp).toBe(312);
        expect(d.currentExp).toBe(reika.currentExp + d.accessEXP);
        expect(d.ap).toBe(260);
        expect(d.damage).toBeUndefined();
        // リンク
        expect(d.link.length).toBe(1);
        expect(d.link[0]).toMatchObject(__assign(__assign({}, charlotte.link[0]), { start: now }));
        // アクセスのEXP
        expect(d.currentExp).toBe(reika.currentExp + 100);
        d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.name).toBe(charlotte.name);
        expect(d.numbering).toBe(charlotte.numbering);
        expect(d.hpBefore).toBe(228);
        expect(d.hpAfter).toBe(0);
        expect(d.currentHp).toBe(228);
        expect((_b = d === null || d === void 0 ? void 0 : d.damage) === null || _b === void 0 ? void 0 : _b.value).toBe(338);
        expect((_c = d === null || d === void 0 ? void 0 : d.damage) === null || _c === void 0 ? void 0 : _c.attr).toBe(true);
        // リブート確認
        expect(d.link.length).toBe(0);
        var e = (_d = result.defense) === null || _d === void 0 ? void 0 : _d.event[1];
        expect(e).not.toBeUndefined();
        expect((e === null || e === void 0 ? void 0 : e.type) === "reboot");
        var data = e === null || e === void 0 ? void 0 : e.data;
        expect(data.denco.name).toBe(charlotte.name);
        expect(data.link.length).toBe(1);
        expect(data.link[0]).toMatchObject(charlotte.link[0]);
        // アクセスのEXP
        expect(d.currentExp).toBe(charlotte.currentExp + d.accessEXP);
        // アクセス後の状態
        expect(result.defense).not.toBeUndefined();
        if (result.defense) {
            charlotte = defense.formation[0];
            var charlotteResult = (0, user_1.getTargetDenco)(result.defense);
            expect(charlotteResult).toMatchObject(__assign(__assign({}, charlotte), { currentExp: charlotte.currentExp + (0, access_1.getAccessDenco)(access, "defense").accessEXP + data.exp, link: [] }));
            reika = offense.formation[0];
            var reikaResult = (0, user_1.getTargetDenco)(result.offense);
            expect(reikaResult).toMatchObject(__assign(__assign({}, reika), { currentExp: reika.currentExp + (0, access_1.getAccessDenco)(access, "offense").accessEXP, link: [
                    __assign(__assign({}, charlotte.link[0]), { start: now })
                ] }));
        }
    });
    test("守備側あり-スキル発動あり-Rebootなし", function () {
        var _a, _b, _c;
        var context = (0, context_1.initContext)("test", "test", false);
        var reika = dencoManager_1.default.getDenco(context, "5", 30);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 80, 3);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
        ]);
        offense = (0, skill_1.activateSkill)(context, offense, 0);
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
        // 相手の確認
        expect(access.defense).not.toBeUndefined();
        // アクセス結果の確認
        expect(access.linkSuccess).toBe(false);
        expect(access.linkDisconncted).toBe(false);
        // リンク
        reika = result.offense.formation[0];
        expect(reika.link.length).toBe(0);
        // アクセス処理の確認
        expect(access.pinkMode).toBe(false);
        expect(access.pinkItemSet).toBe(false);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.attackPercent).toBe(20);
        expect(access.defendPercent).toBe(0);
        // ダメージ計算確認
        expect(access.damageBase).toBe(180);
        expect(access.damageFixed).toBe(0);
        var d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.name).toBe("reika");
        expect(d.hpBefore).toBe(165);
        expect(d.hpAfter).toBe(165);
        expect(d.currentHp).toBe(165);
        expect(d.damage).toBeUndefined();
        expect(access.offense.triggeredSkills.length).toBe(1);
        expect(access.offense.triggeredSkills[0].name).toBe("reika");
        expect(access.offense.triggeredSkills[0].step).toBe("damage_common");
        d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.name).toBe("charlotte");
        expect(d.hpBefore).toBe(324);
        expect(d.hpAfter).toBe(144);
        expect(d.currentHp).toBe(144);
        expect(d.link.length).toBe(3);
        expect((_b = d.damage) === null || _b === void 0 ? void 0 : _b.value).toBe(180);
        expect((_c = d.damage) === null || _c === void 0 ? void 0 : _c.attr).toBe(true);
    });
    test("守備側あり-スキル確率発動なし", function () {
        var _a, _b, _c, _d;
        var context = (0, context_1.initContext)("test", "test", false);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var sheena = dencoManager_1.default.getDenco(context, "7", 50, 3);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
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
        context.random.mode = "ignore";
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.defense).not.toBeUndefined();
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(1);
        var access = result.access;
        // 相手の確認
        expect(access.defense).not.toBeUndefined();
        // アクセス結果の確認
        expect(access.linkSuccess).toBe(false);
        expect(access.linkDisconncted).toBe(false);
        // アクセス処理の確認
        expect(access.pinkMode).toBe(false);
        expect(access.pinkItemSet).toBe(false);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.attackPercent).toBe(0);
        expect(access.defendPercent).toBe(0);
        // ダメージ計算確認
        expect(access.damageBase).toBe(200);
        expect(access.damageFixed).toBe(0);
        expect(access.offense.triggeredSkills.length).toBe(0);
        expect((_b = access.defense) === null || _b === void 0 ? void 0 : _b.triggeredSkills.length).toBe(0);
        var d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.name).toBe("sheena");
        expect(d.hpBefore).toBe(264);
        expect(d.hpAfter).toBe(64);
        expect(d.currentHp).toBe(64);
        expect((_c = d.damage) === null || _c === void 0 ? void 0 : _c.value).toBe(200);
        expect((_d = d.damage) === null || _d === void 0 ? void 0 : _d.attr).toBe(false);
    });
    test("守備側あり-カウンター攻撃あり", function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var context = (0, context_1.initContext)("test", "test", false);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var sheena = dencoManager_1.default.getDenco(context, "7", 50, 3);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
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
        context.random.mode = "force";
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(1);
        expect(result.defense).not.toBeUndefined();
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(1);
        var access = result.access;
        // 相手の確認
        expect(access.defense).not.toBeUndefined();
        // アクセス結果の確認
        expect(access.linkSuccess).toBe(false);
        expect(access.linkDisconncted).toBe(false);
        // アクセス処理の確認
        expect(access.pinkMode).toBe(false);
        expect(access.pinkItemSet).toBe(false);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.attackPercent).toBe(0);
        expect(access.defendPercent).toBe(0);
        // ダメージ計算確認
        expect(access.offense.triggeredSkills.length).toBe(0);
        expect((_b = access.defense) === null || _b === void 0 ? void 0 : _b.triggeredSkills.length).toBe(1);
        expect((_c = access.defense) === null || _c === void 0 ? void 0 : _c.triggeredSkills[0].name).toBe("sheena");
        expect((_d = access.defense) === null || _d === void 0 ? void 0 : _d.triggeredSkills[0].step).toBe("after_damage");
        var d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.name).toBe("sheena");
        expect(d.hpBefore).toBe(264);
        expect(d.hpAfter).toBe(64);
        expect(d.currentHp).toBe(64);
        expect((_e = d.damage) === null || _e === void 0 ? void 0 : _e.value).toBe(200);
        expect((_f = d.damage) === null || _f === void 0 ? void 0 : _f.attr).toBe(false);
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.name).toBe("reika");
        expect(d.hpBefore).toBe(192);
        expect(d.hpAfter).toBe(32);
        expect(d.currentHp).toBe(32);
        expect((_g = d.damage) === null || _g === void 0 ? void 0 : _g.value).toBe(160);
        expect((_h = d.damage) === null || _h === void 0 ? void 0 : _h.attr).toBe(false);
    });
    test("守備側あり-カウンター攻撃あり-Rebootあり", function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var context = (0, context_1.initContext)("test", "test", false);
        var reika = dencoManager_1.default.getDenco(context, "5", 50, 1);
        var sheena = dencoManager_1.default.getDenco(context, "7", 80, 3);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
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
        context.random.mode = "force";
        var result = (0, access_1.startAccess)(context, config);
        expect(result.offense.event.length).toBe(2);
        expect(result.defense).not.toBeUndefined();
        expect((_a = result.defense) === null || _a === void 0 ? void 0 : _a.event.length).toBe(1);
        var access = result.access;
        // 相手の確認
        expect(access.defense).not.toBeUndefined();
        // アクセス結果の確認
        expect(access.linkSuccess).toBe(false);
        expect(access.linkDisconncted).toBe(false);
        // アクセス処理の確認
        expect(access.pinkMode).toBe(false);
        expect(access.pinkItemSet).toBe(false);
        expect(access.pinkItemUsed).toBe(false);
        expect(access.attackPercent).toBe(0);
        expect(access.defendPercent).toBe(0);
        // ダメージ計算確認
        expect(access.offense.triggeredSkills.length).toBe(0);
        expect((_b = access.defense) === null || _b === void 0 ? void 0 : _b.triggeredSkills.length).toBe(1);
        expect((_c = access.defense) === null || _c === void 0 ? void 0 : _c.triggeredSkills[0].name).toBe("sheena");
        expect((_d = access.defense) === null || _d === void 0 ? void 0 : _d.triggeredSkills[0].step).toBe("after_damage");
        var d = (0, access_1.getAccessDenco)(access, "defense");
        expect(d.name).toBe("sheena");
        expect(d.hpBefore).toBe(420);
        expect(d.hpAfter).toBe(220);
        expect(d.currentHp).toBe(220);
        expect((_e = d.damage) === null || _e === void 0 ? void 0 : _e.value).toBe(200);
        expect((_f = d.damage) === null || _f === void 0 ? void 0 : _f.attr).toBe(false);
        d = (0, access_1.getAccessDenco)(access, "offense");
        expect(d.name).toBe("reika");
        expect(d.hpBefore).toBe(192);
        expect(d.hpAfter).toBe(0);
        expect(d.currentHp).toBe(192);
        expect((_g = d.damage) === null || _g === void 0 ? void 0 : _g.value).toBe(250);
        expect((_h = d.damage) === null || _h === void 0 ? void 0 : _h.attr).toBe(false);
        var e = result.offense.event[1];
        expect(e.type).toBe("reboot");
        var reboot = e.data;
        expect(reboot.link.length).toBe(1);
        expect(reboot.link[0]).toMatchObject(reika.link[0]);
        // リンク解除確認
        var reikaResult = (0, user_1.getTargetDenco)(result.offense);
        expect(reikaResult.link.length).toBe(0);
    });
});
//# sourceMappingURL=access.test.js.map