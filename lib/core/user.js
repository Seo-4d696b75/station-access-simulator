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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshEXPState = exports._refreshState = exports.refreshState = exports.copyUserParam = exports.copyUserState = exports.copyUserStateTo = exports.changeFormation = exports.initUser = exports.getTargetDenco = void 0;
var denco_1 = require("./denco");
var skill_1 = require("./skill");
var dencoManager_1 = __importDefault(require("./dencoManager"));
var context_1 = require("./context");
var skillEvent_1 = require("./skillEvent");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
var __1 = require("..");
function getTargetDenco(state) {
    return state.formation[state.carIndex];
}
exports.getTargetDenco = getTargetDenco;
function initUser(context, userName, formation, param) {
    var _a, _b;
    if (!formation)
        formation = [];
    var date = (0, moment_timezone_1.default)((0, context_1.getCurrentTime)(context))
        .millisecond(0)
        .second(0)
        .minute(0)
        .add(1, "h");
    return changeFormation(context, {
        user: {
            name: (_a = param === null || param === void 0 ? void 0 : param.name) !== null && _a !== void 0 ? _a : userName,
            dailyDistance: (_b = param === null || param === void 0 ? void 0 : param.dailyDistance) !== null && _b !== void 0 ? _b : 0,
        },
        formation: [],
        event: [],
        queue: [{
                type: "hour_cycle",
                time: date.valueOf(),
                data: undefined,
            }],
    }, formation);
}
exports.initUser = initUser;
function changeFormation(context, current, formation) {
    var state = __assign(__assign({}, copyUserState(current)), { event: Array.from(current.event), formation: formation.map(function (d) { return (0, denco_1.copyDencoState)(d); }) });
    var before = current.formation.map(function (d) { return d.name; }).join(",");
    var after = formation.map(function (d) { return d.name; }).join(",");
    context.log.log("\u7DE8\u6210\u3092\u5909\u66F4\u3057\u307E\u3059 [" + before + "] -> [" + after + "]");
    _refreshState(context, state);
    return state;
}
exports.changeFormation = changeFormation;
function copyUserStateTo(src, dst) {
    dst.user = copyUserParam(src.user);
    dst.formation.forEach(function (d, idx) { return (0, __1.copyDencoStateTo)(src.formation[idx], d); });
    dst.event = Array.from(src.event);
    dst.queue = Array.from(src.queue);
}
exports.copyUserStateTo = copyUserStateTo;
function copyUserState(state) {
    return {
        user: copyUserParam(state.user),
        formation: state.formation.map(function (d) { return (0, denco_1.copyDencoState)(d); }),
        event: Array.from(state.event),
        queue: Array.from(state.queue),
    };
}
exports.copyUserState = copyUserState;
function copyUserParam(param) {
    return {
        name: param.name,
        dailyDistance: param.dailyDistance
    };
}
exports.copyUserParam = copyUserParam;
/**
 * 現在の編成状態を更新する
 *
 * - 獲得経験値によるレベルアップ
 * - 現在時刻に応じたスキル状態の変更
 * - 現在時刻に応じて予約されたスキル発動型イベントを評価する
 * @param context
 * @param state 現在の状態 引数に渡した現在の状態は変更されません
 * @returns 新しい状態 現在の状態をコピーしてから更新します
 */
function refreshState(context, state) {
    context = (0, __1.fixClock)(context);
    var next = copyUserState(state);
    (0, skill_1.refreshSkillState)(context, next);
    (0, skillEvent_1.refreshEventQueue)(context, next);
    refreshEXPState(context, next);
    return next;
}
exports.refreshState = refreshState;
/**
 * {@link refreshState} の破壊的バージョン
 */
function _refreshState(context, state) {
    context = (0, __1.fixClock)(context);
    (0, skill_1.refreshSkillState)(context, state);
    (0, skillEvent_1.refreshEventQueue)(context, state);
    refreshEXPState(context, state);
}
exports._refreshState = _refreshState;
/**
 * 現在の状態の経験値の確認してレベルアップ処理を行う(破壊的)
 * @param state 現在の状態
 * @returns
 */
function refreshEXPState(context, state) {
    var indices = state.formation.map(function (_, idx) { return idx; });
    indices.forEach(function (idx) { return refreshEXPStateOne(context, state, idx); });
}
exports.refreshEXPState = refreshEXPState;
function refreshEXPStateOne(context, state, idx) {
    var d = state.formation[idx];
    var levelup = checkLevelup(context, d);
    if (levelup) {
        var before = (0, denco_1.copyDencoState)(d);
        // copy
        (0, __1.copyDencoStateTo)(levelup, d);
        // 新規にスキル獲得した場合はスキル状態を初期化
        (0, skill_1.refreshSkillStateOne)(context, state, idx);
        var event_1 = {
            type: "levelup",
            data: {
                time: (0, context_1.getCurrentTime)(context),
                after: (0, denco_1.copyDencoState)(d),
                before: before,
            }
        };
        state.event.push(event_1);
        context.log.log("\u30EC\u30D9\u30EB\u30A2\u30C3\u30D7\uFF1A" + levelup.name + " Lv." + d.level + "->Lv." + levelup.level);
        context.log.log("\u73FE\u5728\u306E\u7D4C\u9A13\u5024\uFF1A" + levelup.name + " " + levelup.currentExp + "/" + levelup.nextExp);
    }
}
function checkLevelup(context, denco) {
    if (denco.currentExp < denco.nextExp)
        return undefined;
    var d = (0, denco_1.copyDencoState)(denco);
    var level = d.level;
    while (d.currentExp >= d.nextExp) {
        var status_1 = dencoManager_1.default.getDencoStatus(d.numbering, level + 1);
        if (status_1) {
            level += 1;
            d = __assign(__assign({}, status_1), { currentHp: status_1.maxHp, currentExp: d.currentExp - d.nextExp, film: d.film, link: d.link, skill: __1.SkillManager.getSkill(d.numbering, level) });
        }
        else {
            // これ以上のレベルアップはなし
            d = __assign(__assign({}, d), { currentExp: d.nextExp });
            break;
        }
    }
    return d;
}
