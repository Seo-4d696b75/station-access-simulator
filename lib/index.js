"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
exports.StationManager = exports.DencoManager = exports.SkillManager = exports.init = void 0;
var source_map_support_1 = __importDefault(require("source-map-support"));
source_map_support_1.default.install();
var skillManager_1 = __importDefault(require("./core/skillManager"));
var dencoManager_1 = __importDefault(require("./core/dencoManager"));
var stationManager_1 = __importDefault(require("./core/stationManager"));
var format_1 = require("./core/format");
var context_1 = require("./core/context");
var user_1 = require("./core/user");
var skill_1 = require("./core/skill");
function init() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, skillManager_1.default.load()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, dencoManager_1.default.load()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, stationManager_1.default.load()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.init = init;
var skillManager_2 = require("./core/skillManager");
Object.defineProperty(exports, "SkillManager", { enumerable: true, get: function () { return __importDefault(skillManager_2).default; } });
var dencoManager_2 = require("./core/dencoManager");
Object.defineProperty(exports, "DencoManager", { enumerable: true, get: function () { return __importDefault(dencoManager_2).default; } });
var stationManager_2 = require("./core/stationManager");
Object.defineProperty(exports, "StationManager", { enumerable: true, get: function () { return __importDefault(stationManager_2).default; } });
__exportStar(require("./core/access"), exports);
__exportStar(require("./core/format"), exports);
__exportStar(require("./core/context"), exports);
__exportStar(require("./core/denco"), exports);
__exportStar(require("./core/user"), exports);
__exportStar(require("./core/skill"), exports);
__exportStar(require("./core/station"), exports);
__exportStar(require("./core/event"), exports);
__exportStar(require("./core/skillEvent"), exports);
__exportStar(require("./core/film"), exports);
init().then(function () {
    var context = (0, context_1.initContext)("test", "test", true);
    var now = Date.parse("2020-01-01T12:50:00.000");
    context.clock = now;
    var moe = dencoManager_1.default.getDenco(context, "9", 80);
    var charlotte = dencoManager_1.default.getDenco(context, "6", 80);
    var sheena = dencoManager_1.default.getDenco(context, "7", 50);
    var state = (0, user_1.initUser)(context, "とあるマスター", [moe, charlotte, sheena]);
    moe = state.formation[0];
    charlotte = state.formation[1];
    sheena = state.formation[2];
    moe.currentHp = Math.floor(moe.maxHp * 0.9);
    charlotte.currentHp = Math.floor(charlotte.maxHp * 0.6);
    sheena.currentHp = Math.floor(sheena.maxHp * 0.2);
    state = (0, skill_1.refreshSkillState)(context, state);
    // 13:00
    context.clock = now + 600 * 1000;
    state = (0, user_1.refreshCurrentTime)(context, state);
    (0, format_1.printEvents)(context, state);
});
//# sourceMappingURL=index.js.map