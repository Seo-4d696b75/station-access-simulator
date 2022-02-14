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
describe("いろはスキル", function () {
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
        var iroha = dencoManager_1.default.getDenco(context, "10", 50);
        expect(iroha.name).toBe("iroha");
        expect(iroha.skill.type).toBe("possess");
        var now = (0, moment_timezone_1.default)().valueOf();
        context.clock = now;
        var state = (0, __1.initUser)(context, "master", [iroha]);
        // リンク数0
        state = (0, __1.refreshState)(context, state);
        iroha = state.formation[0];
        var skill = (0, __1.getSkill)(iroha);
        expect(skill.state.transition).toBe("manual-condition");
        expect(skill.state.type).toBe("unable");
        expect(function () { return (0, __1.activateSkill)(context, state, 0); }).toThrowError();
        // リンク数2 && 編成ひとり
        iroha = dencoManager_1.default.getDenco(context, "10", 50, 2);
        state = (0, __1.initUser)(context, "master", [iroha]);
        iroha = state.formation[0];
        skill = (0, __1.getSkill)(iroha);
        expect(skill.state.type).toBe("unable");
        // リンク数1 && 編成ふたり以上
        iroha = dencoManager_1.default.getDenco(context, "10", 50, 1);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        state = (0, __1.initUser)(context, "master", [iroha, reika]);
        iroha = state.formation[0];
        skill = (0, __1.getSkill)(iroha);
        expect(skill.state.type).toBe("unable");
        // リンク数2 && 編成ふたり以上
        iroha = dencoManager_1.default.getDenco(context, "10", 50, 2);
        reika = dencoManager_1.default.getDenco(context, "5", 50);
        state = (0, __1.initUser)(context, "master", [iroha, reika]);
        iroha = state.formation[0];
        skill = (0, __1.getSkill)(iroha);
        expect(skill.state.type).toBe("idle");
    });
    test("スキル発動-先頭", function () {
        var context = (0, __1.initContext)("test", "test", false);
        var now = (0, moment_timezone_1.default)().valueOf();
        context.clock = now;
        var iroha = dencoManager_1.default.getDenco(context, "10", 50, 2);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var state = (0, __1.initUser)(context, "master", [iroha, reika]);
        iroha = state.formation[0];
        var skill = (0, __1.getSkill)(iroha);
        expect(skill.state.type).toBe("idle");
        var links = iroha.link;
        state = (0, __1.activateSkill)(context, state, 0);
        // スキル発動の確認
        expect(state.event.length).toBe(1);
        var event = state.event[0];
        expect(event.type).toBe("skill_trigger");
        if (event.type === "skill_trigger") {
            expect(event.data.denco.name).toBe("iroha");
            expect(event.data.step).toBe("self");
            expect(event.data.time).toBe(now);
        }
        // スキル状態は即座に idle -> active -> wait
        iroha = state.formation[0];
        skill = (0, __1.getSkill)(iroha);
        expect(skill.state.type).toBe("cooldown");
        expect(skill.state.data).toMatchObject({ cooldownTimeout: now + 7200 * 1000 });
        // リンクの移譲の確認
        expect(iroha.link.length).toBe(1);
        var link = links.filter(function (l) { return l.name !== iroha.link[0].name; })[0];
        reika = state.formation[1];
        expect(reika.link.length).toBe(1);
        expect(reika.link[0]).toMatchObject(link);
        // wait終了後
        context.clock = now + 7200 * 1000;
        state = (0, __1.refreshState)(context, state);
        iroha = state.formation[0];
        skill = (0, __1.getSkill)(iroha);
        expect(skill.state.type).toBe("unable");
    });
    test("スキル発動-先頭以外", function () {
        var context = (0, __1.initContext)("test", "test", false);
        var now = (0, moment_timezone_1.default)().valueOf();
        context.clock = now;
        var iroha = dencoManager_1.default.getDenco(context, "10", 50, 3);
        var reika = dencoManager_1.default.getDenco(context, "5", 50);
        var state = (0, __1.initUser)(context, "master", [reika, iroha]);
        iroha = state.formation[1];
        var skill = (0, __1.getSkill)(iroha);
        expect(skill.state.type).toBe("idle");
        state = (0, __1.activateSkill)(context, state, 1);
        expect(state.event.length).toBe(1);
        var event = state.event[0];
        expect(event.type).toBe("skill_trigger");
        if (event.type === "skill_trigger") {
            expect(event.data.denco.name).toBe("iroha");
            expect(event.data.step).toBe("self");
            expect(event.data.time).toBe(now);
        }
        iroha = state.formation[1];
        skill = (0, __1.getSkill)(iroha);
        expect(skill.state.type).toBe("cooldown");
        expect(skill.state.data).toMatchObject({ cooldownTimeout: now + 7200 * 1000 });
        expect(iroha.link.length).toBe(2);
        reika = state.formation[0];
        expect(reika.link.length).toBe(1);
        context.clock = now + 7200 * 1000;
        state = (0, __1.refreshState)(context, state);
        iroha = state.formation[1];
        skill = (0, __1.getSkill)(iroha);
        expect(skill.state.type).toBe("idle");
    });
});
//# sourceMappingURL=D10_Iroha.test.js.map