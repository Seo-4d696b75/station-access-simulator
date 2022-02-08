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
exports.refreshSkillState = exports.disactivateSkill = exports.activateSkill = exports.isSkillActive = exports.copySkillPossess = exports.copySkillState = exports.copySkill = void 0;
var __1 = require("..");
var context_1 = require("./context");
var denco_1 = require("./denco");
var user_1 = require("./user");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
function copySkill(skill) {
    return __assign(__assign({}, skill), { name: skill.name, level: skill.level, transitionType: skill.transitionType, propertyReader: skill.propertyReader, state: copySkillState(skill.state) });
}
exports.copySkill = copySkill;
function copySkillState(state) {
    switch (state.type) {
        case "active": {
            if (state.data) {
                return {
                    type: "active",
                    data: __assign({}, state.data)
                };
            }
            break;
        }
        case "cooldown": {
            return {
                type: "cooldown",
                data: {
                    cooldownTimeout: state.data.cooldownTimeout
                }
            };
        }
        default: {
            break;
        }
    }
    return {
        type: state.type,
        data: undefined
    };
}
exports.copySkillState = copySkillState;
function copySkillPossess(skill) {
    if (skill.type === "possess") {
        return {
            type: "possess",
            skill: copySkill(skill.skill),
        };
    }
    return {
        type: skill.type,
        skill: undefined,
    };
}
exports.copySkillPossess = copySkillPossess;
/**
* スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
* @param skill
* @returns
*/
function isSkillActive(skill) {
    if (skill.type === "possess") {
        var state = skill.skill.state;
        if (state.type === "not_init") {
            throw Error("skill state not init");
        }
        return state.type === "active";
    }
    return false;
}
exports.isSkillActive = isSkillActive;
/**
 * スキル状態を`active`へ遷移させる
 *
 * 許可される操作は次の場合
 * - タイプ`manual`のスキル状態を`idle > active`へ遷移させる
 * - タイプ`manual-condition`のスキル状態を`idle > active`へ遷移させる
 * - タイプ`auto`のスキル状態を`unable > active`へ遷移させる
 * @returns `active`へ遷移した新しい状態
 */
function activateSkill(context, state) {
    var _a;
    context = (0, context_1.fixClock)(context);
    var next = (0, user_1.copyUserState)(state);
    if (!checkActivateSkill(context, state)) {
        return next;
    }
    var d = next.formation[state.carIndex];
    if (!d) {
        context.log.error("\u5BFE\u8C61\u306E\u3067\u3093\u3053\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 carIndex: " + state.carIndex + ", formation.legth: " + state.formation.length);
        throw Error();
    }
    var skill = (0, denco_1.getSkill)(d);
    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + d.name + " " + skill.state.type + " -> active");
    var self = __assign(__assign({}, d), { carIndex: state.carIndex, skill: skill, skillPropertyReader: skill.propertyReader });
    skill.state = {
        type: "active",
        data: (_a = skill.disactivateAt) === null || _a === void 0 ? void 0 : _a.call(skill, context, state, self)
    };
    // callback #onActivated
    var callback = skill.onActivated;
    if (callback) {
        // 更新したスキル状態をコピー
        self = __assign(__assign({}, (0, denco_1.copyDencoState)(d)), { carIndex: state.carIndex, skill: skill, skillPropertyReader: skill.propertyReader });
        next = callback(context, next, self);
    }
    return refreshSkillState(context, next);
}
exports.activateSkill = activateSkill;
function checkActivateSkill(context, state) {
    var d = state.formation[state.carIndex];
    if (!d) {
        context.log.error("\u5BFE\u8C61\u306E\u3067\u3093\u3053\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 carIndex: " + state.carIndex + ", formation.legth: " + state.formation.length);
    }
    var skill = (0, denco_1.getSkill)(d);
    switch (skill.transitionType) {
        case "manual":
        case "manual-condition": {
            switch (skill.state.type) {
                case "idle": {
                    return true;
                }
                case "active": {
                    return false;
                }
                default: {
                    context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092active\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093(state:" + skill.state.type + ",type:" + skill.transitionType + ")");
                    return false;
                }
            }
        }
        case "auto": {
            switch (skill.state.type) {
                case "unable": {
                    return true;
                }
                case "active": {
                    return false;
                }
                default: {
                    context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092active\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093(state:" + skill.state.type + ",type:auto)");
                    return false;
                }
            }
        }
        default: {
            context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092active\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093 type:" + skill.transitionType);
            return false;
        }
    }
}
/**
 * スキル状態を`cooldown`へ遷移させる
 *
 * 許可される操作は次の場合
 * - タイプ`manual`のスキル状態を`active > cooldown`へ遷移させる
 * - タイプ`manual-condition`のスキル状態を`active > cooldown`へ遷移させる
 * - タイプ`auto`のスキル状態を`active > cooldown`へ遷移させる
 *
 * ただし、`Skill#disactivateAt`で`active, cooldown`の終了時刻を指定している場合はその指定に従うので
 * この呼び出しはエラーとなる
 *
 * @returns `cooldown`へ遷移した新しい状態
 */
function disactivateSkill(context, state) {
    var next = (0, user_1.copyUserState)(state);
    var d = next.formation[state.carIndex];
    if (!d) {
        context.log.error("\u5BFE\u8C61\u306E\u3067\u3093\u3053\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 carIndex: " + state.carIndex + ", formation.legth: " + state.formation.length);
    }
    var skill = (0, denco_1.getSkill)(d);
    context = (0, context_1.fixClock)(context);
    switch (skill.transitionType) {
        case "manual":
        case "manual-condition":
        case "auto": {
            if (skill.state.type === "active") {
                if (skill.state.data) {
                    context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092cooldown\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093, active\u7D42\u4E86\u6642\u523B\u304C\u8A2D\u5B9A\u6E08\u307F\u3067\u3059: " + JSON.stringify(skill.state.data));
                    throw Error();
                }
                var callback = skill.completeCooldownAt;
                if (!callback) {
                    context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092cooldown\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093, cooldown\u306E\u7D42\u4E86\u6642\u523B\u3092\u6307\u5B9A\u3059\u308B\u95A2\u6570 completeCooldownAt \u304C\u672A\u5B9A\u7FA9\u3067\u3059");
                    throw Error();
                }
                skill.state = {
                    type: "cooldown",
                    data: callback(context, next, __assign(__assign({}, d), { carIndex: state.carIndex, skill: skill, skillPropertyReader: skill.propertyReader }))
                };
                context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + d.name + " active -> cooldown");
                return refreshSkillState(context, next);
            }
            else {
                context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092cooldown\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093(state:" + skill.state.type + ")");
            }
            break;
        }
        default: {
            context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092cooldown\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093 type:" + skill.transitionType);
        }
    }
    throw Error();
}
exports.disactivateSkill = disactivateSkill;
/**
 * スキル状態の変化を調べて更新する
 *
 * 以下の状態に依存する`Skill#state`の遷移を調べる
 * - `SkillActiveTimeout` 現在時刻に依存：指定時刻を過ぎたら`cooldown`へ遷移
 * - `SkillCooldownTimeout` 現在時刻に依存：指定時刻を過ぎたら`idle/unable`へ遷移
 * - 遷移タイプ`auto-condition` スキル状態自体が編成状態に依存
 *
 * スキル状態の整合性も同時に確認する
 * @param state 現在の状態
 * @param time 現在時刻
 * @returns 新しい状態
 */
function refreshSkillState(context, state) {
    var size = state.formation.length;
    var next = (0, user_1.copyUserState)(state);
    context = (0, context_1.fixClock)(context);
    for (var idx = 0; idx < size; idx++) {
        next = refreshSkillStateOne(context, next, idx);
    }
    return next;
}
exports.refreshSkillState = refreshSkillState;
function refreshSkillStateOne(context, state, idx) {
    var denco = state.formation[idx];
    if (denco.skillHolder.type !== "possess") {
        return state;
    }
    var skill = (0, denco_1.getSkill)(denco);
    switch (skill.transitionType) {
        case "always": {
            if (skill.state.type === "not_init") {
                skill.state = {
                    type: "active",
                    data: undefined
                };
            }
            if (skill.state.type !== "active") {
                context.log.error("不正なスキル状態です type:always, state: not active");
            }
            return state;
        }
        case "manual": {
            if (skill.state.type === "unable") {
                context.log.error("不正なスキル状態です type:manual, state: unable");
            }
            if (skill.state.type === "not_init") {
                skill.state = {
                    type: "idle",
                    data: undefined
                };
            }
            return refreshTimeout(context, state, idx);
        }
        case "manual-condition": {
            if (skill.state.type === "not_init") {
                skill.state = {
                    type: "unable",
                    data: undefined
                };
            }
            if (skill.state.type === "idle" || skill.state.type === "unable") {
                var predicate = skill.canEnabled;
                if (!predicate) {
                    context.log.error("関数#canEnabled が未定義です type:manual-condition");
                    throw Error();
                }
                var self_1 = __assign(__assign({}, denco), { carIndex: idx, skill: skill, skillPropertyReader: skill.propertyReader });
                var enable = predicate(context, state, self_1);
                if (enable && skill.state.type === "unable") {
                    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " unable -> idle");
                    skill.state = {
                        type: "idle",
                        data: undefined
                    };
                }
                else if (!enable && skill.state.type === "idle") {
                    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " idle -> unable");
                    skill.state = {
                        type: "unable",
                        data: undefined
                    };
                }
                return state;
            }
            else {
                return refreshTimeout(context, state, idx);
            }
        }
        case "auto": {
            if (skill.state.type === "idle") {
                context.log.error("不正なスキル状態です type:auto, state: idle");
            }
            if (skill.state.type === "not_init") {
                skill.state = {
                    type: "unable",
                    data: undefined
                };
            }
            return refreshTimeout(context, state, idx);
        }
        case "auto-condition": {
            if (skill.state.type === "idle") {
                context.log.error("不正なスキル状態です type:auto-condition, state: idle");
            }
            if (skill.state.type === "cooldown") {
                context.log.error("不正なスキル状態です type:auto-condition, state: cooldown");
            }
            if (skill.state.type === "not_init") {
                skill.state = {
                    type: "unable",
                    data: undefined
                };
            }
            // スキル状態の確認・更新
            var predicate = skill.canActivated;
            if (!predicate) {
                context.log.error("関数#canActivated が未定義です type:auto-condition");
                throw Error();
            }
            var self_2 = __assign(__assign({}, denco), { carIndex: idx, skill: skill, skillPropertyReader: skill.propertyReader });
            var active = predicate(context, state, self_2);
            if (active && skill.state.type === "unable") {
                context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " unable -> active");
                skill.state = {
                    type: "active",
                    data: undefined
                };
                var callback = skill.onActivated;
                if (callback) {
                    // 更新したスキル状態をコピー
                    self_2 = __assign(__assign({}, (0, denco_1.copyDencoState)(denco)), { carIndex: idx, skill: skill, skillPropertyReader: skill.propertyReader });
                    state = callback(context, state, self_2);
                    state = (0, user_1.copyUserState)(state);
                }
            }
            else if (!active && skill.state.type === "active") {
                context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " active -> unable");
                skill.state = {
                    type: "unable",
                    data: undefined
                };
            }
            return state;
        }
    }
}
function refreshTimeout(context, state, idx) {
    var time = (0, context_1.getCurrentTime)(context).valueOf();
    var denco = state.formation[idx];
    var skill = (0, denco_1.getSkill)(denco);
    if (skill.state.type === "active") {
        var data = skill.state.data;
        if (data && data.activeTimeout <= time) {
            context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " active -> cooldown (timeout:" + (0, moment_timezone_1.default)(data.activeTimeout).format(__1.TIME_FORMAT) + ")");
            skill.state = {
                type: "cooldown",
                data: {
                    cooldownTimeout: data.cooldownTimeout
                }
            };
        }
    }
    if (skill.state.type === "cooldown") {
        var data = skill.state.data;
        if (data.cooldownTimeout <= time) {
            switch (skill.transitionType) {
                case "manual": {
                    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " cooldown -> idle (timeout:" + (0, moment_timezone_1.default)(data.cooldownTimeout).format(__1.TIME_FORMAT) + ")");
                    skill.state = {
                        type: "idle",
                        data: undefined
                    };
                    break;
                }
                case "manual-condition": {
                    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " cooldown -> unable (timeout:" + (0, moment_timezone_1.default)(data.cooldownTimeout).format(__1.TIME_FORMAT) + ")");
                    skill.state = {
                        type: "idle",
                        data: undefined
                    };
                    // check unable <=> idle
                    return refreshSkillStateOne(context, state, idx);
                }
                case "auto": {
                    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " cooldown -> unable (timeout:" + (0, moment_timezone_1.default)(data.cooldownTimeout).format(__1.TIME_FORMAT) + ")");
                    skill.state = {
                        type: "idle",
                        data: undefined
                    };
                    break;
                }
                default: {
                    context.log.error("\u4E0D\u6B63\u306A\u30B9\u30AD\u30EB\u72B6\u614B\u9077\u79FB\u30BF\u30A4\u30D7 " + skill.transitionType);
                }
            }
        }
    }
    return state;
}
//# sourceMappingURL=skill.js.map