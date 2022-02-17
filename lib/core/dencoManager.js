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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var skillManager_1 = __importDefault(require("./skillManager"));
var stationManager_1 = __importDefault(require("./stationManager"));
var DencoManager = /** @class */ (function () {
    function DencoManager() {
        this.data = new Map();
    }
    DencoManager.prototype.load = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var list, _a, _loop_1, this_1, _i, list_1, e;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!data) return [3 /*break*/, 1];
                        _a = JSON.parse(data);
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../data/base.json")); }).then(function (o) { return o.default; }).catch(function (e) { return []; })];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        list = _a;
                        if (!Array.isArray(list))
                            throw Error("fail to load denco base data");
                        _loop_1 = function (e) {
                            if (!e.numbering || !e.type || !e.name || !e.full_name || !e.attribute) {
                                throw Error("invalid denco data lacking properties " + JSON.stringify(e));
                            }
                            if (!e.AP || !e.HP || !e.EXP) {
                                throw Error("invalid denco status data " + JSON.stringify(e));
                            }
                            var ap = e.AP;
                            var hp = e.HP;
                            var exp = e.EXP;
                            var size = ap.length;
                            if (hp.length !== size || exp.length !== size) {
                                throw Error("invalid denco status: AP, HP, EXP size mismatch " + JSON.stringify(e));
                            }
                            // EXP: level(idx)->level(idx+1)にレベルアップ必要な経験値
                            if (exp[0] !== 0) {
                                throw Error("EXP array[0] must be 0");
                            }
                            exp = __spreadArray(__spreadArray([], exp.slice(1), true), [exp[size - 1]], false);
                            var status_1 = Array(size).fill(0).map(function (_, i) {
                                var status = {
                                    level: i + 1,
                                    ap: ap[i],
                                    maxHp: hp[i],
                                    nextExp: exp[i],
                                    numbering: e.numbering,
                                    name: e.name,
                                    //fullName: e.full_name,
                                    type: e.type,
                                    attr: e.attribute,
                                };
                                return status;
                            });
                            this_1.data.set(e.numbering, status_1);
                        };
                        this_1 = this;
                        for (_i = 0, list_1 = list; _i < list_1.length; _i++) {
                            e = list_1[_i];
                            _loop_1(e);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    DencoManager.prototype.getDenco = function (context, numbering, level, link) {
        if (level === void 0) { level = 50; }
        if (link === void 0) { link = []; }
        var status = this.getDencoStatus(numbering, level);
        if (!status) {
            context.log.error("\u6307\u5B9A\u3057\u305F\u30EC\u30D9\u30EB\u306E\u60C5\u5831\u304C\u3042\u308A\u307E\u305B\u3093 " + numbering + " Lv." + level);
            throw Error("invalid level, status data not found");
        }
        var skill = skillManager_1.default.getSkill(numbering, level);
        var linkList = (typeof link === "number") ?
            stationManager_1.default.getRandomLink(context, link) : link;
        return __assign(__assign({}, status), { currentExp: 0, currentHp: status.maxHp, skill: skill, film: {}, link: linkList });
    };
    DencoManager.prototype.getDencoStatus = function (numbering, level) {
        var data = this.data.get(numbering);
        if (!data)
            throw Error("denco data not found: " + numbering);
        if (level < 1 || level > data.length) {
            return undefined;
        }
        return data[level - 1];
    };
    return DencoManager;
}());
var manager = new DencoManager();
exports.default = manager;
//# sourceMappingURL=dencoManager.js.map