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
exports.enqueueSkillEvent = exports.randomeAccess = exports.evaluateSkillAtEvent = exports.evaluateSkillAfterAccess = exports.disactivateSkill = exports.activateSkill = exports.isSkillActive = exports.getSkill = exports.copyUserState = exports.refreshState = exports.changeFormation = exports.initUser = exports.getTargetDenco = exports.StationManager = exports.DencoManager = exports.SkillManager = exports.clear = exports.init = void 0;
// ?????????????????????????????????????????????
var skillManager_1 = __importDefault(require("./core/skillManager"));
var dencoManager_1 = __importDefault(require("./core/dencoManager"));
var stationManager_1 = __importDefault(require("./core/stationManager"));
/**
 * ?????????????????????????????????
 *
 * ??????????????????????????????????????????????????????????????????????????????
 * ????????????????????????????????????????????????????????????????????????????????????????????????????????????
 */
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var job;
        return __generator(this, function (_a) {
            if (initLib) {
                console.log("skil init");
                return [2 /*return*/, initLib];
            }
            job = Promise.all([
                skillManager_1.default.load(),
                dencoManager_1.default.load(),
                stationManager_1.default.load()
            ]).then(function () {
                console.log("???????????????????????????????????????");
            });
            initLib = job;
            return [2 /*return*/, job];
        });
    });
}
exports.init = init;
var initLib = undefined;
/**
 * ??????????????????????????????????????????????????????????????????
 */
function clear() {
    skillManager_1.default.clear();
    dencoManager_1.default.clear();
    stationManager_1.default.clear();
    initLib = undefined;
}
exports.clear = clear;
var skillManager_2 = require("./core/skillManager");
Object.defineProperty(exports, "SkillManager", { enumerable: true, get: function () { return __importDefault(skillManager_2).default; } });
var dencoManager_2 = require("./core/dencoManager");
Object.defineProperty(exports, "DencoManager", { enumerable: true, get: function () { return __importDefault(dencoManager_2).default; } });
var stationManager_2 = require("./core/stationManager");
Object.defineProperty(exports, "StationManager", { enumerable: true, get: function () { return __importDefault(stationManager_2).default; } });
var user_1 = require("./core/user");
Object.defineProperty(exports, "getTargetDenco", { enumerable: true, get: function () { return user_1.getTargetDenco; } });
Object.defineProperty(exports, "initUser", { enumerable: true, get: function () { return user_1.initUser; } });
Object.defineProperty(exports, "changeFormation", { enumerable: true, get: function () { return user_1.changeFormation; } });
Object.defineProperty(exports, "refreshState", { enumerable: true, get: function () { return user_1.refreshState; } });
Object.defineProperty(exports, "copyUserState", { enumerable: true, get: function () { return user_1.copyUserState; } });
var skill_1 = require("./core/skill");
Object.defineProperty(exports, "getSkill", { enumerable: true, get: function () { return skill_1.getSkill; } });
Object.defineProperty(exports, "isSkillActive", { enumerable: true, get: function () { return skill_1.isSkillActive; } });
Object.defineProperty(exports, "activateSkill", { enumerable: true, get: function () { return skill_1.activateSkill; } });
Object.defineProperty(exports, "disactivateSkill", { enumerable: true, get: function () { return skill_1.disactivateSkill; } });
__exportStar(require("./core/access"), exports);
var skillEvent_1 = require("./core/skillEvent");
Object.defineProperty(exports, "evaluateSkillAfterAccess", { enumerable: true, get: function () { return skillEvent_1.evaluateSkillAfterAccess; } });
Object.defineProperty(exports, "evaluateSkillAtEvent", { enumerable: true, get: function () { return skillEvent_1.evaluateSkillAtEvent; } });
Object.defineProperty(exports, "randomeAccess", { enumerable: true, get: function () { return skillEvent_1.randomeAccess; } });
Object.defineProperty(exports, "enqueueSkillEvent", { enumerable: true, get: function () { return skillEvent_1.enqueueSkillEvent; } });
__exportStar(require("./core/format"), exports);
__exportStar(require("./core/context"), exports);
__exportStar(require("./core/denco"), exports);
__exportStar(require("./core/station"), exports);
__exportStar(require("./core/event"), exports);
__exportStar(require("./core/film"), exports);
