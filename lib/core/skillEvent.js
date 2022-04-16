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
exports.refreshEventQueue = exports.evaluateSkillAtEvent = exports.enqueueSkillEvent = exports.randomeAccess = exports.evaluateSkillAfterAccess = void 0;
var moment_timezone_1 = __importDefault(require("moment-timezone"));
var __1 = require("..");
var Access = __importStar(require("./access"));
var context_1 = require("./context");
var denco_1 = require("./denco");
var skill_1 = require("./skill");
var user_1 = require("./user");
function copySKillEventDencoState(state) {
    return __assign(__assign({}, (0, denco_1.copyDencoState)(state)), { who: state.who, carIndex: state.carIndex, skillInvalidated: state.skillInvalidated });
}
function copySkillEventState(state) {
    return {
        time: state.time,
        user: state.user,
        formation: state.formation.map(function (d) { return copySKillEventDencoState(d); }),
        carIndex: state.carIndex,
        event: Array.from(state.event),
        probability: state.probability,
        probabilityBoostPercent: state.probabilityBoostPercent,
    };
}
/**
 * アクセス直後のタイミングでスキル発動型のイベントを処理する
 *
 * {@link Skill onAccessComplete}からの呼び出しを想定
 *
 * `probability`に{@link ProbabilityPercent}を指定した場合は確率補正も考慮して確率計算を行い
 * 発動が可能な場合のみ`evaluate`で指定されたスキル発動時の状態変更を適用します
 *
 * 発動確率以外にも直前のアクセスで該当スキルが無効化されている場合は状態変更は行いません
 *
 * @param context ログ・乱数等の共通状態
 * @param state 現在の状態
 * @param self スキル発動の主体
 * @param probability スキル発動が確率依存かどうか
 * @param evaluate スキル発動時の処理
 * @returns スキルが発動した場合は効果が反映さらた新しい状態・発動しない場合はstateと同値な状態
 */
function evaluateSkillAfterAccess(context, state, self, probability, evaluate) {
    context = (0, context_1.fixClock)(context);
    var next = (0, __1.copyAccessUserResult)(state);
    if (!(0, skill_1.isSkillActive)(self.skill)) {
        context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u304C\u30A2\u30AF\u30C6\u30A3\u30D6\u3067\u3042\u308A\u307E\u305B\u3093 " + self.name);
        throw Error();
    }
    if (self.skillInvalidated) {
        context.log.log("\u30B9\u30AD\u30EB\u304C\u76F4\u524D\u306E\u30A2\u30AF\u30BB\u30B9\u3067\u7121\u52B9\u5316\u3055\u308C\u3066\u3044\u307E\u3059 " + self.name);
        return next;
    }
    var eventState = {
        user: (0, user_1.copyUserParam)(state.user),
        time: (0, context_1.getCurrentTime)(context),
        formation: state.formation.map(function (d, idx) {
            return __assign(__assign({}, (0, denco_1.copyDencoState)(d)), { who: idx === self.carIndex ? "self" : "other", carIndex: idx, skillInvalidated: self.skillInvalidated });
        }),
        carIndex: self.carIndex,
        event: [],
        probability: probability,
        probabilityBoostPercent: 0,
    };
    var result = execute(context, eventState, evaluate);
    if (result) {
        // スキル発動による影響の反映
        next = __assign(__assign({}, next), { formation: result.formation.map(function (d, idx) {
                // 編成内位置は不変と仮定
                var access = state.formation[idx];
                return __assign(__assign({}, access), (0, denco_1.copyDencoState)(d) // でんこ最新状態(順番注意)
                );
            }), event: __spreadArray(__spreadArray([], state.event, true), result.event, true) });
    }
    (0, user_1._refreshState)(context, next);
    return next;
}
exports.evaluateSkillAfterAccess = evaluateSkillAfterAccess;
function execute(context, state, evaluate) {
    context.log.log("\u30B9\u30AD\u30EB\u8A55\u4FA1\u30A4\u30D9\u30F3\u30C8\u306E\u958B\u59CB");
    var self = state.formation[state.carIndex];
    if (self.skill.type !== "possess") {
        context.log.error("\u30B9\u30AD\u30EB\u3092\u4FDD\u6301\u3057\u3066\u3044\u307E\u305B\u3093 " + self.name);
        throw Error("no active skill found");
    }
    var skill = self.skill;
    context.log.log(self.name + " " + skill.name);
    // TODO ラッピングによる補正
    // 主体となるスキルとは別に事前に発動するスキル
    var others = state.formation.filter(function (s) {
        return (0, skill_1.isSkillActive)(s.skill) && !s.skillInvalidated && s.carIndex !== self.carIndex;
    }).map(function (d) { return d.carIndex; });
    others.forEach(function (idx) {
        // スキル発動による状態変更を考慮して各評価直前にコピー
        var s = copySKillEventDencoState(state.formation[idx]);
        var skill = s.skill;
        if (skill.type !== "possess") {
            context.log.error("\u30B9\u30AD\u30EB\u8A55\u4FA1\u51E6\u7406\u4E2D\u306B\u30B9\u30AD\u30EB\u4FDD\u6709\u72B6\u614B\u304C\u5909\u66F4\u3057\u3066\u3044\u307E\u3059 " + s.name + " possess => " + skill.type);
            throw Error();
        }
        var active = __assign(__assign({}, s), { skill: skill });
        var next = skill.evaluateOnEvent ? skill.evaluateOnEvent(context, state, active) : undefined;
        if (next) {
            state = next;
            var e = {
                type: "skill_trigger",
                data: {
                    time: state.time.valueOf(),
                    carIndex: state.carIndex,
                    denco: (0, denco_1.copyDencoState)(state.formation[idx]),
                    skillName: skill.name,
                    step: "probability_check"
                },
            };
            state.event.push(e);
        }
    });
    // 発動確率の確認
    if (!canSkillEvaluated(context, state)) {
        context.log.log("スキル評価イベントの終了（発動なし）");
        // 主体となるスキルが発動しない場合は他すべての付随的に発動したスキルも取り消し
        return;
    }
    // 最新の状態を参照
    self = copySKillEventDencoState(state.formation[state.carIndex]);
    // 主体となるスキルの発動
    var d = __assign(__assign({}, self), { skill: skill });
    var result = evaluate(context, state, d);
    state = result;
    var trigger = {
        type: "skill_trigger",
        data: {
            time: state.time.valueOf(),
            carIndex: state.carIndex,
            denco: (0, denco_1.copyDencoState)(state.formation[state.carIndex]),
            skillName: skill.name,
            step: "self"
        },
    };
    state.event.push(trigger);
    context.log.log("スキル評価イベントの終了");
    return state;
}
function canSkillEvaluated(context, state) {
    var percent = state.probability;
    var boost = state.probabilityBoostPercent;
    if (typeof percent === "boolean") {
        return percent;
    }
    if (percent >= 100) {
        return true;
    }
    if (percent <= 0) {
        return false;
    }
    if (boost !== 0) {
        var v = percent * (1 + boost / 100.0);
        context.log.log("\u78BA\u7387\u88DC\u6B63: +" + boost + "% " + percent + "% > " + v + "%");
        percent = Math.min(v, 100);
    }
    if (Access.random(context, percent)) {
        context.log.log("\u30B9\u30AD\u30EB\u304C\u767A\u52D5\u3067\u304D\u307E\u3059 \u78BA\u7387:" + percent + "%");
        return true;
    }
    context.log.log("\u30B9\u30AD\u30EB\u304C\u767A\u52D5\u3057\u307E\u305B\u3093\u3067\u3057\u305F \u78BA\u7387:" + percent + "%");
    return false;
}
function randomeAccess(context, state) {
    context = (0, context_1.fixClock)(context);
    //TODO ランダム駅の選択
    var station = {
        name: "ランダムな駅",
        nameKana: "らんだむなえき",
        attr: "unknown",
    };
    var config = {
        offense: {
            state: {
                user: state.user,
                formation: state.formation.map(function (d) { return (0, denco_1.copyDencoState)(d); }),
                event: [],
                queue: [],
            },
            carIndex: state.carIndex
        },
        station: station
    };
    var result = Access.startAccess(context, config);
    if (result.offense.event.length !== 1) {
        context.log.error("\u30A4\u30D9\u30F3\u30C8\u6570\u304C\u60F3\u5B9A\u5916 event:" + JSON.stringify(result.offense.event));
    }
    return {
        time: state.time,
        user: state.user,
        formation: result.offense.formation.map(function (d, idx) {
            var current = state.formation[idx];
            return __assign(__assign({}, (0, denco_1.copyDencoState)(d)), { who: current.who, carIndex: current.carIndex, skillInvalidated: current.skillInvalidated });
        }),
        carIndex: state.carIndex,
        event: __spreadArray(__spreadArray([], state.event, true), [
            result.offense.event[0],
        ], false),
        probability: state.probability,
        probabilityBoostPercent: state.probabilityBoostPercent,
    };
}
exports.randomeAccess = randomeAccess;
/**
 * スキル発動型イベントを指定時刻に評価するよう待機列に追加する
 *
 * @param context
 * @param state
 * @param entry
 * @returns 待機列に追加した新しい状態
 */
function enqueueSkillEvent(context, state, time, event) {
    var now = (0, context_1.getCurrentTime)(context).valueOf();
    if (now > time) {
        context.log.error("\u73FE\u5728\u6642\u523B\u3088\u308A\u524D\u306E\u6642\u523B\u306F\u6307\u5B9A\u3067\u304D\u307E\u305B\u3093 time: " + time + ", event: " + JSON.stringify(event));
        throw Error();
    }
    var next = (0, user_1.copyUserState)(state);
    next.queue.push({
        type: "skill",
        time: time,
        data: event
    });
    next.queue.sort(function (a, b) { return a.time - b.time; });
    refreshEventQueue(context, next);
    return next;
}
exports.enqueueSkillEvent = enqueueSkillEvent;
/**
 * スキルを評価する
 *
 * アクセス中のスキル発動とは別に単独で発動する場合に使用します
 * - アクセス直後のタイミングで評価する場合は {@link evaluateSkillAfterAccess}を使用してください
 * - アクセス処理中のスキル評価は{@link Skill}のコールバック関数`canEvaluate, evaluate`で行ってください
 *
 * `probability`に`number`を指定した場合は確率補正も考慮して確率計算を行い
 * 発動が可能な場合のみ`evaluate`で指定されたスキル発動時の状態変更を適用します
 *
 * @param context
 * @param state 現在の状態
 * @param self 発動するスキル本人
 * @param probability スキル発動確率
 * @param evaluate 評価するスキルの効果内容
 * @returns スキルを評価して更新した新しい状態
 */
function evaluateSkillAtEvent(context, state, self, probability, evaluate) {
    var next = (0, user_1.copyUserState)(state);
    var idx = state.formation.findIndex(function (d) { return d.numbering === self.numbering; });
    if (idx < 0) {
        context.log.log("\u30B9\u30AD\u30EB\u767A\u52D5\u306E\u4E3B\u4F53\u3068\u306A\u308B\u3067\u3093\u3053\u304C\u7DE8\u6210\u5185\u306B\u5C45\u307E\u305B\u3093\uFF08\u7D42\u4E86\uFF09 formation: " + state.formation.map(function (d) { return d.name; }));
        return next;
    }
    if (state.formation[idx].skill.type !== "possess") {
        context.log.log("\u30B9\u30AD\u30EB\u767A\u52D5\u306E\u4E3B\u4F53\u3068\u306A\u308B\u3067\u3093\u3053\u304C\u30B9\u30AD\u30EB\u3092\u4FDD\u6709\u3057\u3066\u3044\u307E\u305B\u3093\uFF08\u7D42\u4E86\uFF09 skill: " + state.formation[idx].skill.type);
        return next;
    }
    var eventState = {
        time: (0, context_1.getCurrentTime)(context).valueOf(),
        user: state.user,
        formation: next.formation.map(function (d, i) {
            return __assign(__assign({}, (0, denco_1.copyDencoState)(d)), { who: idx === i ? "self" : "other", carIndex: i, skillInvalidated: false });
        }),
        carIndex: idx,
        event: [],
        probability: probability,
        probabilityBoostPercent: 0,
    };
    var result = execute(context, eventState, evaluate);
    if (result) {
        // スキル発動による影響の反映
        next = {
            user: result.user,
            formation: result.formation.map(function (d) { return (0, denco_1.copyDencoState)(d); }),
            event: __spreadArray(__spreadArray([], next.event, true), result.event, true),
            queue: next.queue,
        };
    }
    (0, user_1._refreshState)(context, next);
    return next;
}
exports.evaluateSkillAtEvent = evaluateSkillAtEvent;
/**
 * 待機列中のイベントの指定時刻を現在時刻に参照して必要なら評価を実行する(破壊的)
 * @param context 現在時刻は`context#clock`を参照する {@see getCurrentTime}
 * @param state
 * @returns 発動できるイベントが待機列中に存在する場合は評価を実行した新しい状態
 */
function refreshEventQueue(context, state) {
    context = (0, context_1.fixClock)(context);
    var time = (0, context_1.getCurrentTime)(context).valueOf();
    while (state.queue.length > 0) {
        var entry = state.queue[0];
        if (time < entry.time)
            break;
        state.queue.splice(0, 1);
        // start event
        context.log.log("\u5F85\u6A5F\u5217\u4E2D\u306E\u30B9\u30AD\u30EB\u8A55\u4FA1\u30A4\u30D9\u30F3\u30C8\u304C\u6307\u5B9A\u6642\u523B\u306B\u306A\u308A\u307E\u3057\u305F time: " + (0, moment_timezone_1.default)(entry.time).format(__1.TIME_FORMAT) + " type: " + entry.type);
        switch (entry.type) {
            case "skill": {
                var next = evaluateSkillAtEvent(context, state, entry.data.denco, entry.data.probability, entry.data.evaluate);
                (0, user_1.copyUserStateTo)(next, state);
                break;
            }
            case "hour_cycle": {
                var size = state.formation.length;
                for (var i = 0; i < size; i++) {
                    var d = state.formation[i];
                    var skill = d.skill;
                    if (skill.type !== "possess" || skill.state.type !== "active")
                        continue;
                    var callback = skill.onHourCycle;
                    if (!callback)
                        continue;
                    var self_1 = __assign(__assign({}, (0, denco_1.copyDencoState)(d)), { carIndex: i, skill: skill, skillPropertyReader: skill.property });
                    var next = callback(context, state, self_1);
                    (0, user_1.copyUserStateTo)(next, state);
                }
                // 次のイベント追加
                var date = (0, moment_timezone_1.default)(entry.time).add(1, "h");
                state.queue.push({
                    type: "hour_cycle",
                    time: date.valueOf(),
                    data: undefined
                });
                state.queue.sort(function (a, b) { return a.time - b.time; });
                break;
            }
        }
        // end event
    }
}
exports.refreshEventQueue = refreshEventQueue;
