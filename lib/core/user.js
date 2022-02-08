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
exports.refreshCurrentTime = exports.refreshEXPState = exports.copyUserState = exports.changeFormation = exports.initUser = exports.getTargetDenco = void 0;
var denco_1 = require("./denco");
var skill_1 = require("./skill");
var dencoManager_1 = __importDefault(require("./dencoManager"));
var context_1 = require("./context");
var skillEvent_1 = require("./skillEvent");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
function getTargetDenco(state) {
    return state.formation[state.carIndex];
}
exports.getTargetDenco = getTargetDenco;
function initUser(context, userName, formation) {
    if (!formation)
        formation = [];
    var date = (0, moment_timezone_1.default)((0, context_1.getCurrentTime)(context))
        .millisecond(0)
        .second(0)
        .minute(0)
        .add(1, "h");
    return changeFormation(context, {
        name: userName,
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
    var state = __assign(__assign({}, current), { event: Array.from(current.event), formation: Array.from(formation) });
    var before = current.formation.map(function (d) { return d.name; }).join(",");
    var after = formation.map(function (d) { return d.name; }).join(",");
    context.log.log("\u7DE8\u6210\u3092\u5909\u66F4\u3057\u307E\u3059 [" + before + "] -> [" + after + "]");
    return (0, skill_1.refreshSkillState)(context, state);
}
exports.changeFormation = changeFormation;
function copyUserState(state) {
    return {
        name: state.name,
        formation: Array.from(state.formation).map(function (d) { return (0, denco_1.copyDencoState)(d); }),
        event: Array.from(state.event),
        queue: Array.from(state.queue),
    };
}
exports.copyUserState = copyUserState;
/**
 * 現在の状態の経験値の確認してレベルアップ処理を行う
 * @param next 現在の状態
 * @returns
 */
function refreshEXPState(context, state) {
    var next = dencoManager_1.default.checkLevelup(context, state);
    state.formation.forEach(function (before, idx) {
        var after = next.formation[idx];
        if (before.level < after.level) {
            var levelup = {
                time: (0, context_1.getCurrentTime)(context).valueOf(),
                after: (0, denco_1.copyDencoState)(after),
                before: (0, denco_1.copyDencoState)(before),
            };
            var event_1 = {
                type: "levelup",
                data: levelup
            };
            next.event.push(event_1);
            context.log.log("\u30EC\u30D9\u30EB\u30A2\u30C3\u30D7\uFF1A" + after.name + " Lv." + before.level + "->Lv." + after.level);
            context.log.log("\u73FE\u5728\u306E\u7D4C\u9A13\u5024\uFF1A" + after.name + " " + after.currentExp + "/" + after.nextExp);
        }
    });
    return next;
}
exports.refreshEXPState = refreshEXPState;
/**
 * 現在時刻に依存する状態を更新する
 *
 * - 指定時刻にスキル状態を変更する
 * - 指定時刻にスキル発動型イベントを評価する
 *
 * @param context
 * @param state
 * @returns 更新された新しい状態
 */
function refreshCurrentTime(context, state) {
    var next = (0, skill_1.refreshSkillState)(context, state);
    return (0, skillEvent_1.refreshEventQueue)(context, next);
}
exports.refreshCurrentTime = refreshCurrentTime;
//# sourceMappingURL=user.js.map