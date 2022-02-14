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
var context_1 = require("../core/context");
var stationManager_1 = __importDefault(require("../core/stationManager"));
var skillManager_1 = __importDefault(require("../core/skillManager"));
var dencoManager_1 = __importDefault(require("../core/dencoManager"));
var user_1 = require("../core/user");
var access_1 = require("../core/access");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
describe("経験値の処理", function () {
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
                    return [2 /*return*/];
            }
        });
    }); });
    test("レベルアップ1", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var reika = dencoManager_1.default.getDenco(context, "5", 1);
        expect(reika.level).toBe(1);
        expect(reika.currentExp).toBe(0);
        expect(reika.nextExp).toBe(400);
        var state = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
        ]);
        var time = (0, moment_timezone_1.default)().valueOf();
        context.clock = time;
        reika = state.formation[0];
        reika.currentExp = 500;
        state = (0, user_1.refreshState)(context, state);
        var current = state.formation[0];
        expect(current.level).toBe(2);
        expect(current.currentExp).toBe(100);
        expect(state.event.length).toBe(1);
        var event = state.event[0];
        expect(event.type).toBe("levelup");
        var data = event.data;
        expect(data.time).toBe(time);
        expect(data.before).toMatchObject(reika);
        expect(data.after).toMatchObject(current);
    });
    test("レベルアップ2", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var reika = dencoManager_1.default.getDenco(context, "5", 10);
        expect(reika.level).toBe(10);
        expect(reika.currentExp).toBe(0);
        expect(reika.nextExp).toBe(4900);
        var state = (0, user_1.initUser)(context, "とあるマスター１", [
            reika
        ]);
        var time = (0, moment_timezone_1.default)().valueOf();
        context.clock = time;
        state = (0, user_1.refreshState)(context, state);
        reika = state.formation[0];
        reika.currentExp = 44758;
        state = (0, user_1.refreshState)(context, state);
        var current = state.formation[0];
        expect(current.level).toBe(16);
        expect(current.currentExp).toBe(5858);
        expect(state.event.length).toBe(1);
        var event = state.event[0];
        expect(event.type).toBe("levelup");
        var data = event.data;
        expect(data.time).toBe(time.valueOf());
        expect(data.before).toMatchObject(reika);
        expect(data.after).toMatchObject(current);
    });
    test("アクセス-Reboot-レベルアップ", function () {
        var context = (0, context_1.initContext)("test", "test", false);
        var reika = dencoManager_1.default.getDenco(context, "5", 10, 3);
        var charlotte = dencoManager_1.default.getDenco(context, "6", 50);
        expect(reika.level).toBe(10);
        expect(reika.currentExp).toBe(0);
        expect(reika.nextExp).toBe(4900);
        var offense = (0, user_1.initUser)(context, "とあるマスター１", [
            charlotte
        ]);
        var defense = (0, user_1.initUser)(context, "とあるマスター２", [
            reika
        ]);
        reika = defense.formation[0];
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
        if (result.defense) {
            var state = result.defense;
            // アクセス終了直後（レベルアップ前）
            expect(state.event.length).toBe(3);
            var event_1 = state.event[0];
            expect(event_1.type).toBe("access");
            var accessResult = event_1.data;
            var defense_1 = (0, access_1.getDefense)(accessResult.access);
            var accessEXP = 0;
            reika = __assign(__assign({}, reika), { link: [], currentExp: accessEXP });
            expect(defense_1.formation[0]).toMatchObject(reika);
            // リブート
            event_1 = state.event[1];
            expect(event_1.type).toBe("reboot");
            var links = event_1.data;
            var linksEXP = links.exp;
            expect(links.denco).toMatchObject(reika);
            // レベルアップ
            event_1 = state.event[2];
            expect(event_1.type).toBe("levelup");
            var levelup = event_1.data;
            reika = __assign(__assign({}, reika), { link: [], currentExp: accessEXP + linksEXP });
            expect(levelup.before).toMatchObject(reika);
            // レベルアップ後の状態
            var tmp = (0, user_1.initUser)(context, "hoge", [reika]);
            tmp = (0, user_1.refreshState)(context, tmp);
            reika = tmp.formation[0];
            // 最終状態
            var current = result.defense.formation[0];
            expect(current.level).toBe(reika.level);
            expect(current.currentExp).toBe(reika.currentExp);
            expect(levelup.after).toMatchObject(current);
        }
    });
});
//# sourceMappingURL=exp.test.js.map