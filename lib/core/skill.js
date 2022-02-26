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
exports.refreshSkillStateOne = exports.refreshSkillState = exports.disactivateSkill = exports.activateSkill = exports.isSkillActive = exports.copySkill = exports.getSkill = exports.copySkillState = void 0;
var __1 = require("..");
var context_1 = require("./context");
var denco_1 = require("./denco");
var user_1 = require("./user");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
function copySkillState(state) {
    switch (state.type) {
        case "active": {
            if (state.data) {
                return {
                    type: "active",
                    transition: state.transition,
                    data: __assign({}, state.data)
                };
            }
            break;
        }
        case "cooldown": {
            return {
                type: "cooldown",
                transition: state.transition,
                data: {
                    cooldownTimeout: state.data.cooldownTimeout
                }
            };
        }
        case "not_init":
        case "idle":
        case "unable": {
            return __assign({}, state);
        }
    }
    return __assign({}, state);
}
exports.copySkillState = copySkillState;
function getSkill(denco) {
    if (denco.skill.type === "possess") {
        return denco.skill;
    }
    throw Error("skill not found");
}
exports.getSkill = getSkill;
/**
 * 関数プロパティは参照コピーのみ
 * @param skill
 * @returns
 */
function copySkill(skill) {
    if (skill.type === "possess") {
        return __assign(__assign({}, skill), { name: skill.name, level: skill.level, propertyReader: skill.propertyReader, state: copySkillState(skill.state) });
    }
    return {
        type: skill.type,
    };
}
exports.copySkill = copySkill;
/**
* スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
* @param skill
* @returns
*/
function isSkillActive(skill) {
    if (skill.type === "possess") {
        var state = skill.state;
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
    var carIndex = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        carIndex[_i - 2] = arguments[_i];
    }
    context = (0, context_1.fixClock)(context);
    return carIndex.reduce(function (next, idx) { return activateSkillOne(context, next, idx); }, (0, user_1.copyUserState)(state));
}
exports.activateSkill = activateSkill;
function activateSkillOne(context, state, carIndex) {
    var d = state.formation[carIndex];
    if (!d) {
        context.log.error("\u5BFE\u8C61\u306E\u3067\u3093\u3053\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 carIndex: " + carIndex + ", formation.legth: " + state.formation.length);
        throw Error();
    }
    if (d.skill.type !== "possess") {
        context.log.error("\u5BFE\u8C61\u306E\u3067\u3093\u3053\u306F\u30B9\u30AD\u30EB\u3092\u4FDD\u6709\u3057\u3066\u3044\u307E\u305B\u3093 " + d.name);
        throw Error();
    }
    if (d.skill.state.type === "not_init") {
        context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u304C\u521D\u671F\u5316\u3055\u308C\u3066\u3044\u307E\u305B\u3093 " + d.name);
        throw Error();
    }
    var skill = d.skill;
    switch (skill.state.transition) {
        case "manual":
        case "manual-condition": {
            switch (skill.state.type) {
                case "idle": {
                    return activateSkillAndCallback(context, state, d, d.skill, skill.state.transition, carIndex);
                }
                case "active": {
                    return state;
                }
                default: {
                    context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092active\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093(state:" + skill.state.type + ",transition:" + skill.state.transition + ")");
                    throw Error();
                }
            }
        }
        case "auto": {
            switch (skill.state.type) {
                case "unable": {
                    return activateSkillAndCallback(context, state, d, d.skill, "auto", carIndex);
                }
                case "active": {
                    return state;
                }
                default: {
                    context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092active\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093(state:" + skill.state.type + ",type:auto)");
                    throw Error();
                }
            }
        }
        default: {
            context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092active\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093 type:" + skill.state.transition);
            throw Error();
        }
    }
}
function activateSkillAndCallback(context, state, d, skill, transition, carIndex) {
    var _a;
    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + d.name + " " + skill.state.type + " -> active");
    var self = __assign(__assign({}, d), { carIndex: carIndex, skill: skill });
    skill.state = {
        type: "active",
        transition: transition,
        data: (_a = skill.disactivateAt) === null || _a === void 0 ? void 0 : _a.call(skill, context, state, self)
    };
    // callback #onActivated
    var callback = skill.onActivated;
    if (callback) {
        // 更新したスキル状態をコピー
        self = __assign(__assign({}, (0, denco_1.copyDencoState)(d)), { carIndex: carIndex, skill: skill });
        state = callback(context, state, self);
    }
    refreshSkillState(context, state);
    return state;
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
    var carIndex = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        carIndex[_i - 2] = arguments[_i];
    }
    context = (0, context_1.fixClock)(context);
    return carIndex.reduce(function (next, idx) { return disactivateSkillOne(context, next, idx); }, (0, user_1.copyUserState)(state));
}
exports.disactivateSkill = disactivateSkill;
function disactivateSkillOne(context, state, carIndex) {
    var d = state.formation[carIndex];
    if (!d) {
        context.log.error("\u5BFE\u8C61\u306E\u3067\u3093\u3053\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 carIndex: " + carIndex + ", formation.legth: " + state.formation.length);
        throw Error();
    }
    if (d.skill.type !== "possess") {
        context.log.error("\u5BFE\u8C61\u306E\u3067\u3093\u3053\u306F\u30B9\u30AD\u30EB\u3092\u4FDD\u6709\u3057\u3066\u3044\u307E\u305B\u3093 " + d.name);
        throw Error();
    }
    var skill = d.skill;
    context = (0, context_1.fixClock)(context);
    switch (skill.state.transition) {
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
                    transition: skill.state.transition,
                    data: callback(context, state, __assign(__assign({}, d), { carIndex: carIndex, skill: skill }))
                };
                context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + d.name + " active -> cooldown");
                refreshSkillState(context, state);
                return state;
            }
            else {
                context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092cooldown\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093(state:" + skill.state.type + ")");
            }
            break;
        }
        default: {
            context.log.error("\u30B9\u30AD\u30EB\u72B6\u614B\u3092cooldown\u306B\u5909\u66F4\u3067\u304D\u307E\u305B\u3093 transition:" + skill.state.transition);
        }
    }
    throw Error();
}
/**
 * スキル状態の変化を調べて更新する（破壊的）
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
    var indices = state.formation.map(function (_, idx) { return idx; });
    indices.forEach(function (idx) { return refreshSkillStateOne(context, state, idx); });
}
exports.refreshSkillState = refreshSkillState;
function refreshSkillStateOne(context, state, idx) {
    var denco = state.formation[idx];
    if (denco.skill.type !== "possess") {
        return;
    }
    var skill = denco.skill;
    switch (skill.state.transition) {
        case "always": {
            if (skill.state.type === "not_init") {
                skill.state = {
                    type: "active",
                    transition: "always",
                    data: undefined,
                };
            }
            return;
        }
        case "manual": {
            if (skill.state.type === "not_init") {
                skill.state = {
                    type: "idle",
                    transition: "manual",
                    data: undefined
                };
            }
            refreshTimeout(context, state, idx);
            return;
        }
        case "manual-condition": {
            if (skill.state.type === "not_init") {
                skill.state = {
                    type: "unable",
                    transition: "manual-condition",
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
                        transition: "manual-condition",
                        data: undefined
                    };
                }
                else if (!enable && skill.state.type === "idle") {
                    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " idle -> unable");
                    skill.state = {
                        type: "unable",
                        transition: "manual-condition",
                        data: undefined
                    };
                }
                return;
            }
            else {
                refreshTimeout(context, state, idx);
                return;
            }
        }
        case "auto": {
            if (skill.state.type === "not_init") {
                skill.state = {
                    type: "unable",
                    transition: "auto",
                    data: undefined
                };
            }
            refreshTimeout(context, state, idx);
            return;
        }
        case "auto-condition": {
            if (skill.state.type === "not_init") {
                skill.state = {
                    type: "unable",
                    transition: "auto-condition",
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
                    transition: "auto-condition",
                    data: undefined
                };
                var callback = skill.onActivated;
                if (callback) {
                    // 更新したスキル状態をコピー
                    self_2 = __assign(__assign({}, (0, denco_1.copyDencoState)(denco)), { carIndex: idx, skill: skill, skillPropertyReader: skill.propertyReader });
                    var next = callback(context, (0, user_1.copyUserState)(state), self_2);
                    (0, user_1.copyUserStateTo)(next, state);
                }
            }
            else if (!active && skill.state.type === "active") {
                context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " active -> unable");
                skill.state = {
                    type: "unable",
                    transition: "auto-condition",
                    data: undefined
                };
            }
            return;
        }
    }
}
exports.refreshSkillStateOne = refreshSkillStateOne;
function refreshTimeout(context, state, idx) {
    var time = (0, context_1.getCurrentTime)(context).valueOf();
    var denco = state.formation[idx];
    var skill = denco.skill;
    if (skill.type !== "possess")
        return;
    if (skill.state.type === "active") {
        var data = skill.state.data;
        if (data && data.activeTimeout <= time) {
            context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " active -> cooldown (timeout:" + (0, moment_timezone_1.default)(data.activeTimeout).format(__1.TIME_FORMAT) + ")");
            skill.state = {
                type: "cooldown",
                transition: skill.state.transition,
                data: {
                    cooldownTimeout: data.cooldownTimeout
                }
            };
        }
    }
    if (skill.state.type === "cooldown") {
        var data = skill.state.data;
        if (data.cooldownTimeout <= time) {
            switch (skill.state.transition) {
                case "manual": {
                    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " cooldown -> idle (timeout:" + (0, moment_timezone_1.default)(data.cooldownTimeout).format(__1.TIME_FORMAT) + ")");
                    skill.state = {
                        type: "idle",
                        transition: "manual",
                        data: undefined
                    };
                    break;
                }
                case "manual-condition": {
                    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " cooldown -> unable (timeout:" + (0, moment_timezone_1.default)(data.cooldownTimeout).format(__1.TIME_FORMAT) + ")");
                    skill.state = {
                        type: "unable",
                        transition: "manual-condition",
                        data: undefined
                    };
                    // check unable <=> idle
                    refreshSkillStateOne(context, state, idx);
                    return;
                }
                case "auto": {
                    context.log.log("\u30B9\u30AD\u30EB\u72B6\u614B\u306E\u5909\u66F4\uFF1A" + denco.name + " cooldown -> unable (timeout:" + (0, moment_timezone_1.default)(data.cooldownTimeout).format(__1.TIME_FORMAT) + ")");
                    skill.state = {
                        type: "unable",
                        transition: "auto",
                        data: undefined
                    };
                    break;
                }
            }
        }
    }
}
