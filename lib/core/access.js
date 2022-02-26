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
exports.counterAttack = exports.repeatAccess = exports.calcBaseDamage = exports.getBaseDamage = exports.random = exports.hasSkillTriggered = exports.getDefense = exports.getAccessDenco = exports.getFormation = exports.copyAccessUserResult = exports.copyAccessSideState = exports.copyAccessState = exports.startAccess = void 0;
var moment_timezone_1 = __importDefault(require("moment-timezone"));
var context_1 = require("./context");
var denco_1 = require("./denco");
var skill_1 = require("./skill");
var user_1 = require("./user");
var DEFAULT_SCORE_PREDICATE = {
    calcAccessScore: function (context, state, station) { return 100; },
    calcLinkSuccessScore: function (context, state, access) { return 100; },
    calcDamageScore: function (context, damage) { return Math.floor(damage); },
    calcLinkScore: function (context, link) { return Math.floor(((0, context_1.getCurrentTime)(context) - link.start) / 100); }
};
function addDamage(src, damage) {
    if (src) {
        return {
            value: src.value + damage.value,
            attr: src.attr || damage.attr
        };
    }
    else {
        return damage;
    }
}
function hasDefense(state) {
    return !!state.defense;
}
function initAccessDencoState(context, f, carIndex, which) {
    var tmp = (0, user_1.copyUserState)(f);
    (0, skill_1.refreshSkillState)(context, tmp);
    var formation = tmp.formation.map(function (e, idx) {
        var s = __assign(__assign({}, e), { hpBefore: e.currentHp, hpAfter: e.currentHp, which: which, who: idx === carIndex ? which : "other", carIndex: idx, reboot: false, skillInvalidated: false, damage: undefined, exp: {
                access: 0,
                skill: 0,
                link: 0,
            } });
        return s;
    });
    var d = formation[carIndex];
    if (!d) {
        context.log.error("\u5BFE\u8C61\u306E\u3067\u3093\u3053\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 side: " + which + " carIndex: " + carIndex + ", formation.legth: " + formation.length);
    }
    return {
        user: (0, user_1.copyUserParam)(f.user),
        carIndex: carIndex,
        formation: formation,
        triggeredSkills: [],
        probabilityBoostPercent: 0,
        probabilityBoosted: false,
        score: {
            access: 0,
            skill: 0,
            link: 0,
        },
        displayedScore: 0,
        displayedExp: 0,
    };
}
function startAccess(context, config) {
    context = (0, context_1.fixClock)(context);
    var time = (0, context_1.getCurrentTime)(context);
    context.log.log("\u30A2\u30AF\u30BB\u30B9\u51E6\u7406\u306E\u958B\u59CB " + (0, moment_timezone_1.default)(time).format("YYYY-MM-DD HH:mm:ss.SSS"));
    var state = {
        time: time.valueOf(),
        station: config.station,
        offense: initAccessDencoState(context, config.offense.state, config.offense.carIndex, "offense"),
        defense: undefined,
        damageFixed: 0,
        attackPercent: 0,
        defendPercent: 0,
        damageRatio: 1.0,
        linkSuccess: false,
        linkDisconncted: false,
        pinkMode: false,
        pinkItemSet: !!config.usePink,
        pinkItemUsed: false,
        depth: 0,
    };
    // アクセス駅とリンクの確認
    var d = getAccessDenco(state, "offense");
    var idx = d.link.findIndex(function (link) { return link.name === config.station.name; });
    if (idx >= 0) {
        context.log.warn("\u653B\u6483\u5074(" + d.name + ")\u306E\u30EA\u30F3\u30AF\u306B\u5BFE\u8C61\u99C5(" + config.station.name + ")\u304C\u542B\u307E\u308C\u3066\u3044\u307E\u3059,\u524A\u9664\u3057\u307E\u3059");
        d.link = d.link.splice(idx, 1);
    }
    if (config.defense) {
        state.defense = initAccessDencoState(context, config.defense.state, config.defense.carIndex, "defense");
        var d_1 = getAccessDenco(state, "defense");
        var link = d_1.link.find(function (link) { return link.name === config.station.name; });
        if (!link) {
            context.log.warn("\u5B88\u5099\u5074(" + d_1.name + ")\u306E\u30EA\u30F3\u30AF\u306B\u5BFE\u8C61\u99C5(" + config.station.name + ")\u304C\u542B\u307E\u308C\u3066\u3044\u307E\u305B\u3093,\u8FFD\u52A0\u3057\u307E\u3059");
            link = __assign(__assign({}, config.station), { start: (0, context_1.getCurrentTime)(context).valueOf() - 100 });
            d_1.link.push(link);
        }
    }
    state = execute(context, state);
    context.log.log("アクセス処理の終了");
    return completeAccess(context, config, copyAccessState(state));
}
exports.startAccess = startAccess;
function copyAccessState(state) {
    return {
        time: state.time,
        station: state.station,
        attackPercent: state.attackPercent,
        defendPercent: state.defendPercent,
        damageFixed: state.damageFixed,
        damageRatio: state.damageRatio,
        damageBase: state.damageBase,
        pinkItemSet: state.pinkItemSet,
        pinkItemUsed: state.pinkItemUsed,
        pinkMode: state.pinkMode,
        linkSuccess: state.linkSuccess,
        linkDisconncted: state.linkDisconncted,
        offense: copyAccessSideState(state.offense),
        defense: state.defense ? copyAccessSideState(state.defense) : undefined,
        depth: state.depth,
    };
}
exports.copyAccessState = copyAccessState;
function copyAccessDencoState(state) {
    return __assign(__assign({}, (0, denco_1.copyDencoState)(state)), { which: state.which, who: state.who, carIndex: state.carIndex, hpBefore: state.hpBefore, hpAfter: state.hpAfter, reboot: state.reboot, skillInvalidated: state.skillInvalidated, damage: state.damage ? __assign({}, state.damage) : undefined, exp: __assign({}, state.exp) });
}
function copyAccessDencoResult(state) {
    return __assign(__assign({}, copyAccessDencoState(state)), { disconnetedLink: state.disconnetedLink });
}
function copyAccessSideState(state) {
    return {
        user: (0, user_1.copyUserParam)(state.user),
        carIndex: state.carIndex,
        score: __assign({}, state.score),
        probabilityBoostPercent: state.probabilityBoostPercent,
        probabilityBoosted: state.probabilityBoosted,
        formation: Array.from(state.formation).map(function (d) { return copyAccessDencoState(d); }),
        triggeredSkills: Array.from(state.triggeredSkills),
        displayedScore: state.displayedScore,
        displayedExp: state.displayedExp,
    };
}
exports.copyAccessSideState = copyAccessSideState;
function copyAccessUserResult(state) {
    return __assign(__assign({}, (0, user_1.copyUserState)(state)), { carIndex: state.carIndex, score: state.score, probabilityBoostPercent: state.probabilityBoostPercent, probabilityBoosted: state.probabilityBoosted, formation: state.formation.map(function (d) { return copyAccessDencoResult(d); }), triggeredSkills: Array.from(state.triggeredSkills), displayedScore: state.displayedScore, displayedExp: state.displayedExp });
}
exports.copyAccessUserResult = copyAccessUserResult;
function completeAccess(context, config, access) {
    var _a;
    var result = __assign(__assign({}, copyAccessState(access)), { offense: initUserResult(context, config.offense.state, access, "offense"), defense: config.defense ? initUserResult(context, config.defense.state, access, "defense") : undefined });
    // 各でんこのリンク状態を計算
    result = completeDencoLink(context, result, "offense");
    result = completeDencoLink(context, result, "defense");
    // 経験値の反映
    result = completeDencoEXP(context, result, "offense");
    result = completeDencoEXP(context, result, "defense");
    // アクセスイベントを追加
    result = addAccessEvent(context, config.offense.state, result, "offense");
    result = addAccessEvent(context, (_a = config.defense) === null || _a === void 0 ? void 0 : _a.state, result, "defense");
    // レベルアップ処理
    result = checkLevelup(context, result);
    // アクセス直後のスキル発動イベント
    result = checkSKillState(context, result);
    result = checkSkillAfterAccess(context, result, "offense");
    result = checkSkillAfterAccess(context, result, "defense");
    result = checkSKillState(context, result);
    return result;
}
function checkSkillAfterAccess(context, state, which) {
    var side = (which === "offense") ? state.offense : state.defense;
    if (!side)
        return state;
    var formation = side;
    filterActiveSkill(side.formation).forEach(function (idx) {
        // スキル発動による状態変更を考慮して評価直前にコピー
        var d = copyAccessDencoResult(formation.formation[idx]);
        var skill = d.skill;
        if (skill.type !== "possess") {
            context.log.error("\u30B9\u30AD\u30EB\u8A55\u4FA1\u51E6\u7406\u4E2D\u306B\u30B9\u30AD\u30EB\u4FDD\u6709\u72B6\u614B\u304C\u5909\u66F4\u3057\u3066\u3044\u307E\u3059 " + d.name + " possess => " + skill.type);
            throw Error();
        }
        var predicate = skill === null || skill === void 0 ? void 0 : skill.onAccessComplete;
        if (skill && predicate) {
            var self_1 = __assign(__assign({}, d), { skill: skill });
            var next = predicate(context, formation, self_1, state);
            if (next) {
                formation = next;
            }
        }
    });
    if (which === "offense") {
        state.offense = formation;
    }
    else {
        state.defense = formation;
    }
    return state;
}
function calcLinkResult(context, link, d, idx) {
    var _a, _b;
    var time = (0, context_1.getCurrentTime)(context);
    var duration = time - link.start;
    if (duration < 0) {
        context.log.error("\u30EA\u30F3\u30AF\u6642\u9593\u304C\u8CA0\u6570\u3067\u3059 " + duration + "[ms] " + JSON.stringify(link));
    }
    var predicate = (_b = (_a = context.scorePredicate) === null || _a === void 0 ? void 0 : _a.calcLinkScore) !== null && _b !== void 0 ? _b : DEFAULT_SCORE_PREDICATE.calcLinkScore;
    var score = predicate(context, link);
    var attr = (link.attr === d.attr);
    var ratio = (idx < LINK_COMBO_RATIO.length) ?
        LINK_COMBO_RATIO[idx] : LINK_COMBO_RATIO[LINK_COMBO_RATIO.length - 1];
    var match = attr ? Math.floor(score * 0.15) : 0;
    var combo = Math.floor(score * (ratio - 1));
    return __assign(__assign({}, link), { end: time, duration: duration, linkScore: score, matchAttr: attr, matchBonus: match, comboBonus: combo, totatlScore: score + match + combo });
}
var LINK_COMBO_RATIO = [
    1.0, 1.1, 1.2, 1.3, 1.4,
    1.6, 1, 7, 1.9, 2.1, 2.3,
    2.5, 2.8, 3.1, 3.4, 3.7,
    4.1, 4.5, 5.0, 5.5, 6.1,
    6.7, 7.4, 8.1, 8.9, 9.8,
    10.8, 11.9, 13.1, 14.4, 15.8,
    17.4, 19.1, 20.0
];
/**
 * 指定したリンクを解除したリンク結果を計算する
 * @param context
 * @param links 解除するリンク
 * @param d 対象のリンクを解除した直後の状態
 * @param which アクセス時にどちら側か
 * @returns
 */
function calcLinksResult(context, links, d, which) {
    var time = (0, context_1.getCurrentTime)(context).valueOf();
    var linkResult = links.map(function (link, idx) { return calcLinkResult(context, link, d, idx); });
    var linkScore = linkResult.map(function (link) { return link.linkScore; }).reduce(function (a, b) { return a + b; }, 0);
    var match = linkResult.filter(function (link) { return link.matchAttr; });
    var matchBonus = match.map(function (link) { return link.matchBonus; }).reduce(function (a, b) { return a + b; }, 0);
    var comboBonus = linkResult.map(function (link) { return link.comboBonus; }).reduce(function (a, b) { return a + b; }, 0);
    var totalScore = linkScore + matchBonus + comboBonus;
    var exp = calcExp(totalScore);
    var result = {
        time: time,
        denco: (0, denco_1.copyDencoState)(d),
        which: which,
        totalScore: totalScore,
        linkScore: linkScore,
        comboBonus: comboBonus,
        matchBonus: matchBonus,
        matchCnt: match.length,
        exp: exp,
        link: linkResult,
    };
    return result;
}
function calcExp(score) {
    // TODO 経験値増加の加味
    return score;
}
function initUserResult(context, state, access, which) {
    var side = (which === "offense") ? access.offense : access.defense;
    if (!side) {
        context.log.error("\u30A2\u30AF\u30BB\u30B9\u7D50\u679C\u306E\u521D\u671F\u5316\u306B\u5931\u6557");
        throw Error();
    }
    return __assign(__assign(__assign({}, (0, user_1.copyUserState)(state)), { event: [] }), copyAccessSideState(side));
}
function addAccessEvent(context, origin, result, which) {
    var side = (which === "offense") ? result.offense : result.defense;
    if (!side || !origin)
        return result;
    var copy = copyAccessState(result);
    side.event = __spreadArray(__spreadArray(__spreadArray([], origin.event, true), [
        {
            // このアクセスイベントを追加
            type: "access",
            data: {
                access: copy,
                which: which
            }
        }
    ], false), side.event, true);
    return result;
}
function checkSKillState(context, result) {
    (0, skill_1.refreshSkillState)(context, result.offense);
    if (result.defense) {
        (0, skill_1.refreshSkillState)(context, result.defense);
    }
    return result;
}
function checkLevelup(context, result) {
    (0, user_1.refreshEXPState)(context, result.offense);
    if (result.defense) {
        (0, user_1.refreshEXPState)(context, result.defense);
    }
    return result;
}
function getDenco(state, which) {
    var s = which === "offense" ? state.offense : getDefense(state);
    return s.formation[s.carIndex];
}
/**
 * アクセスにおける編成（攻撃・守備側）を取得する
 * @param state アクセス状態 {@link AccessState}
 * @param which 攻撃側・守備側のどちらか指定する
 * @throws 存在しない守備側を指定した場合はErrorを投げる
 * @returns `AccessDencoState[]`
 */
function getFormation(state, which) {
    if (which === "offense") {
        return state.offense.formation;
    }
    else {
        return getDefense(state).formation;
    }
}
exports.getFormation = getFormation;
/**
 * アクセスにおいて直接アクセスする・アクセスを受けるでんこを取得する
 * @param state アクセス状態 {@link AccessState}
 * @param which 攻撃側・守備側のどちらか指定
 * @throws 存在しない守備側を指定した場合Error
 * @returns {@link AccessDencoState}
 */
function getAccessDenco(state, which) {
    if (which === "offense") {
        return state.offense.formation[state.offense.carIndex];
    }
    else {
        var f = getDefense(state);
        return f.formation[f.carIndex];
    }
}
exports.getAccessDenco = getAccessDenco;
/**
 * アクセスの守備側の状態を取得する
 * @param state
 * @returns {@link AccessSideState}
 * @throws 守備側が存在しない場合はError
 */
function getDefense(state) {
    var s = state.defense;
    if (!s) {
        throw Error("守備側が見つかりません");
    }
    return s;
}
exports.getDefense = getDefense;
function execute(context, state, top) {
    var _a, _b, _c, _d, _e, _f;
    if (top === void 0) { top = true; }
    if (top) {
        // log active skill
        var names = state.offense.formation
            .filter(function (d) { return hasActiveSkill(d); })
            .map(function (d) { return d.name; })
            .join(",");
        context.log.log("\u653B\u6483\uFF1A" + getDenco(state, "offense").name);
        context.log.log("\u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30B9\u30AD\u30EB(\u653B\u6483\u5074): " + names);
        if (hasDefense(state)) {
            var defense = getDefense(state);
            names = defense.formation
                .filter(function (d) { return hasActiveSkill(d); })
                .map(function (d) { return d.name; })
                .join(",");
            context.log.log("\u5B88\u5099\uFF1A" + getDenco(state, "defense").name);
            context.log.log("\u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30B9\u30AD\u30EB(\u5B88\u5099\u5074): " + names);
        }
        else {
            context.log.log("守備側はいません");
        }
        // pink_check
        // フットバの確認、アイテム優先=>スキル評価
        if (hasDefense(state)) {
            if (state.pinkItemSet) {
                state.pinkItemUsed = true;
                state.pinkMode = true;
                context.log.log("フットバースアイテムを使用");
            }
            else {
                // PROBABILITY_CHECK の前に評価する
                // 現状メロしか存在せずこの実装でもよいだろう
                context.log.log("スキルを評価：フットバースの確認");
                state = evaluateSkillAt(context, state, "pink_check");
            }
        }
        if (state.pinkMode)
            context.log.log("フットバースが発動！");
        // 確率補正の可能性 とりあえず発動させて後で調整
        context.log.log("スキルを評価：確率ブーストの確認");
        state = evaluateSkillAt(context, state, "probability_check");
        // アクセスによるスコアと経験値
        var predicate = (_b = (_a = context.scorePredicate) === null || _a === void 0 ? void 0 : _a.calcAccessScore) !== null && _b !== void 0 ? _b : DEFAULT_SCORE_PREDICATE.calcAccessScore;
        var score = predicate(context, state.offense, state.station);
        var exp = calcExp(score);
        var accessDenco = getAccessDenco(state, "offense");
        accessDenco.exp.access += exp;
        state.offense.score.access += score;
        context.log.log("\u30A2\u30AF\u30BB\u30B9\u306B\u3088\u308B\u8FFD\u52A0 " + accessDenco.name + " score:" + score + " exp:" + exp);
    }
    // 他ピンクに関係なく発動するもの
    context.log.log("スキルを評価：アクセス開始前");
    state = evaluateSkillAt(context, state, "before_access");
    context.log.log("スキルを評価：アクセス開始");
    state = evaluateSkillAt(context, state, "start_access");
    if (hasDefense(state) && !state.pinkMode) {
        context.log.log("攻守のダメージ計算を開始");
        // 属性ダメージの補正値
        var attrOffense = getDenco(state, "offense").attr;
        var attrDefense = getDenco(state, "defense").attr;
        var attr = (attrOffense === "cool" && attrDefense === "heat") ||
            (attrOffense === "heat" && attrDefense === "eco") ||
            (attrOffense === "eco" && attrDefense === "cool");
        if (attr) {
            state.damageRatio = 1.3;
            context.log.log("攻守の属性によるダメージ補正が適用：1.3");
        }
        else {
            state.damageRatio = 1.0;
        }
        // TODO filmによる増減の設定
        context.log.warn("フィルムによる補正をスキップ");
        // ダメージ増減の設定
        context.log.log("スキルを評価：ATK&DEFの増減");
        state = evaluateSkillAt(context, state, "damage_common");
        // 特殊なダメージの計算
        context.log.log("スキルを評価：特殊なダメージ計算");
        state = evaluateSkillAt(context, state, "damage_special");
        // 基本ダメージの計算
        if (!state.damageBase) {
            state.damageBase = {
                variable: calcBaseDamage(context, state),
                constant: 0
            };
        }
        // 固定ダメージの計算
        context.log.log("スキルを評価：固定ダメージ");
        state = evaluateSkillAt(context, state, "damage_fixed");
        context.log.log("\u56FA\u5B9A\u30C0\u30E1\u30FC\u30B8\u306E\u8A08\u7B97\uFF1A" + state.damageFixed);
        // 最終ダメージ計算 固定ダメージ等の影響でも負数にはならない
        var defense = getAccessDenco(state, "defense");
        var damageBase = state.damageBase;
        if (!damageBase) {
            context.log.error("基本ダメージの値が見つかりません");
            throw Error("base damage not set");
        }
        if (damageBase.variable < 0 || damageBase.constant < 0) {
            context.log.error("\u57FA\u672C\u30C0\u30E1\u30FC\u30B8\u306E\u5024\u306F\u975E\u8CA0\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059 " + JSON.stringify(damageBase));
        }
        var damage = {
            // 固定ダメージで負数にはせず0以上に固定 & 確保されたダメージ量を加算
            value: Math.max(damageBase.variable + state.damageFixed, 0) + damageBase.constant,
            attr: state.damageRatio !== 1.0
        };
        // ダメージ量に応じたスコア＆経験値の追加
        var predicate = (_d = (_c = context.scorePredicate) === null || _c === void 0 ? void 0 : _c.calcDamageScore) !== null && _d !== void 0 ? _d : DEFAULT_SCORE_PREDICATE.calcDamageScore;
        var score = predicate(context, damage.value);
        var exp = calcExp(score);
        var accessDenco = getAccessDenco(state, "offense");
        accessDenco.exp.access += exp;
        state.offense.score.access += score;
        context.log.log("\u30C0\u30E1\u30FC\u30B8\u91CF\u306B\u3088\u308B\u8FFD\u52A0 " + accessDenco.name + " score:" + score + " exp:" + exp);
        // 反撃など複数回のダメージ計算が発生する場合はそのまま加算
        var damageSum = addDamage(defense.damage, damage);
        context.log.log("\u30C0\u30E1\u30FC\u30B8\u8A08\u7B97\u304C\u7D42\u4E86\uFF1A" + damageSum.value);
        // 攻守ふたりに関してアクセス結果を仮決定
        defense.damage = damageSum;
        // HPの決定 & HP0 になったらリブート
        updateDencoHP(context, defense);
        // 被アクセス側がリブートしたらリンク解除（ピンク除く）
        state.linkDisconncted = defense.reboot;
        // 被アクセス側がリンク解除、かつアクセス側がリブートしていない
        state.linkSuccess = state.linkDisconncted;
        context.log.log("\u5B88\u5099\u306E\u7D50\u679C HP: " + defense.hpBefore + " > " + defense.hpAfter + " reboot:" + defense.reboot);
    }
    else if (state.pinkMode) {
        // ピンク
        state.linkDisconncted = true;
        state.linkSuccess = true;
    }
    else {
        // 相手不在
        state.linkSuccess = true;
    }
    context.log.log("アクセス結果を仮決定");
    context.log.log("\u653B\u6483\u5074\u306E\u30EA\u30F3\u30AF\u6210\u679C\uFF1A" + state.linkSuccess);
    context.log.log("\u5B88\u5099\u5074\u306E\u30EA\u30F3\u30AF\u89E3\u9664\uFF1A" + state.linkDisconncted);
    context.log.log("スキルを評価：ダメージ計算完了後");
    state = evaluateSkillAt(context, state, "after_damage");
    if (top) {
        context.log.log("最終的なアクセス結果を決定");
        // 最後に確率ブーストの有無を判定
        checkProbabilityBoost(state.offense);
        if (hasDefense(state)) {
            checkProbabilityBoost(state.defense);
        }
        // 最終的なリブート有無＆変化後のHPを計算
        state = completeDencoHP(context, state, "offense");
        state = completeDencoHP(context, state, "defense");
        // 最終的なアクセス結果を計算 カウンターで変化する場合あり
        if (hasDefense(state) && !state.pinkMode) {
            var defense = getAccessDenco(state, "defense");
            state.linkDisconncted = defense.reboot;
            var offense = getAccessDenco(state, "offense");
            state.linkSuccess = state.linkDisconncted && !offense.reboot;
        }
        context.log.log("\u653B\u6483\u5074\u306E\u30EA\u30F3\u30AF\u6210\u679C\uFF1A" + state.linkSuccess);
        context.log.log("\u5B88\u5099\u5074\u306E\u30EA\u30F3\u30AF\u89E3\u9664\uFF1A" + state.linkDisconncted);
        if (state.linkSuccess) {
            // リンク成功によるスコア＆経験値の付与
            var predicate = (_f = (_e = context.scorePredicate) === null || _e === void 0 ? void 0 : _e.calcLinkSuccessScore) !== null && _f !== void 0 ? _f : DEFAULT_SCORE_PREDICATE.calcLinkSuccessScore;
            var score = predicate(context, state.offense, state);
            var exp = calcExp(score);
            var linkDenco = getAccessDenco(state, "offense");
            linkDenco.exp.access += exp;
            state.offense.score.access += score;
            context.log.log("\u30EA\u30F3\u30AF\u6210\u529F\u306B\u3088\u308B\u8FFD\u52A0 " + linkDenco.name + " score:" + score + " exp:" + exp);
        }
        // 表示用の経験値＆スコアの計算
        state = completeDisplayScoreExp(context, state, "offense");
        state = completeDisplayScoreExp(context, state, "defense");
    }
    return state;
}
function evaluateSkillAt(context, state, step) {
    // 編成順に スキル発動有無の確認 > 発動による状態の更新 
    // ただしアクティブなスキルの確認は初めに一括で行う（同じステップで発動するスキル無効化は互いに影響しない）
    var offenseActive = filterActiveSkill(state.offense.formation);
    var defense = state.defense;
    var defenseActive = defense ? filterActiveSkill(defense.formation) : undefined;
    offenseActive.forEach(function (idx) {
        // 他スキルの発動で状態が変化する場合があるので毎度参照してからコピーする
        var d = copyAccessDencoState(state.offense.formation[idx]);
        var skill = d.skill;
        if (skill.type !== "possess") {
            context.log.error("\u30B9\u30AD\u30EB\u8A55\u4FA1\u51E6\u7406\u4E2D\u306B\u30B9\u30AD\u30EB\u4FDD\u6709\u72B6\u614B\u304C\u5909\u66F4\u3057\u3066\u3044\u307E\u3059 " + d.name + " possess => " + skill.type);
            throw Error();
        }
        if (skill && (!state.pinkMode || skill.evaluateInPink)) {
            var active = __assign(__assign({}, d), { skill: skill, skillPropertyReader: skill.propertyReader });
            // 状態に依存するスキル発動有無の判定は毎度行う
            if (canSkillEvaluated(context, state, step, active)) {
                markTriggerSkill(state.offense, step, d);
                context.log.log("\u30B9\u30AD\u30EB\u304C\u767A\u52D5(\u653B\u6483\u5074) name:" + d.name + "(" + d.numbering + ") skill:" + skill.name);
                state = skill.evaluate ? skill.evaluate(context, state, step, active) : state;
            }
        }
    });
    if (defense && defenseActive) {
        defenseActive.forEach(function (idx) {
            var d = copyAccessDencoState(defense.formation[idx]);
            var skill = d.skill;
            if (skill.type !== "possess") {
                context.log.error("\u30B9\u30AD\u30EB\u8A55\u4FA1\u51E6\u7406\u4E2D\u306B\u30B9\u30AD\u30EB\u4FDD\u6709\u72B6\u614B\u304C\u5909\u66F4\u3057\u3066\u3044\u307E\u3059 " + d.name + " possess => " + skill.type);
                throw Error();
            }
            if (skill && (!state.pinkMode || skill.evaluateInPink)) {
                var active = __assign(__assign({}, d), { skill: skill, skillPropertyReader: skill.propertyReader });
                if (canSkillEvaluated(context, state, step, active)) {
                    markTriggerSkill(defense, step, d);
                    context.log.log("\u30B9\u30AD\u30EB\u304C\u767A\u52D5(\u5B88\u5099\u5074) name:" + d.name + "(" + d.numbering + ") skill:" + skill.name);
                    state = skill.evaluate ? skill.evaluate(context, state, step, active) : state;
                }
            }
        });
    }
    return state;
}
function markTriggerSkill(state, step, denco) {
    var list = state.triggeredSkills;
    var idx = list.findIndex(function (d) { return d.numbering === denco.numbering; });
    if (idx < 0) {
        list.push(__assign(__assign({}, denco), { step: step }));
    }
}
/**
 * 指定したでんこのスキルが発動済みか確認する
 *
 * １度目のスキル発動における各コールバック呼び出しのタイミングでの返値の変化は次のとおり
 * - `Skill#canEvaluate` : `false`
 * - `Skill#evaluate` : `true`
 * @param state
 * @param denco
 * @param step `undefined`の場合は`denco`の一致でのみ検索する
 * @returns true if has been triggered
 */
function hasSkillTriggered(state, denco, step) {
    if (!state)
        return false;
    return state.triggeredSkills.findIndex(function (t) {
        return t.numbering === denco.numbering && (!step || step === t.step);
    }) >= 0;
}
exports.hasSkillTriggered = hasSkillTriggered;
/**
 * 編成からアクティブなスキル（スキルの保有・スキル状態・スキル無効化の影響を考慮）を抽出する
 * @param list
 * @param step
 * @param which
 * @returns
 */
function filterActiveSkill(list) {
    return list.filter(function (d) {
        return hasActiveSkill(d);
    }).map(function (d) { return d.carIndex; });
}
/**
 * アクセス中のスキル無効化の影響も考慮してアクティブなスキルか判定
 * @param d
 * @returns
 */
function hasActiveSkill(d) {
    return isSkillActive(d.skill) && !d.skillInvalidated;
}
/**
 * スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
 * @param skill
 * @returns
 */
function isSkillActive(skill) {
    return skill.type === "possess" && skill.state.type === "active";
}
/**
 * スキルのロジックと発動確率まで総合して発動有無を判定する
 * @param state
 * @param d 発動する可能性があるアクティブなスキル
 * @returns
 */
function canSkillEvaluated(context, state, step, d) {
    var _a;
    var trigger = d.skill.canEvaluate ? d.skill.canEvaluate(context, state, step, d) : false;
    if (typeof trigger === 'boolean') {
        return trigger;
    }
    var percent = Math.min(trigger, 100);
    percent = Math.max(percent, 0);
    if (percent >= 100)
        return true;
    if (percent <= 0)
        return false;
    // 上記までは確率に依存せず決定可能
    var boost = d.which === "offense" ? state.offense.probabilityBoostPercent : (_a = state.defense) === null || _a === void 0 ? void 0 : _a.probabilityBoostPercent;
    if (!boost && boost !== 0) {
        context.log.error("存在しない守備側の確率補正計算を実行しようとしました");
        throw Error("defense not set, but try to read probability_boost_percent");
    }
    if (boost !== 0) {
        var v = percent * (1 + boost / 100.0);
        context.log.log("\u78BA\u7387\u88DC\u6B63: +" + boost + "% " + percent + "% > " + v + "%");
        percent = Math.min(v, 100);
        // 発動の如何を問わず確率補正のスキルは発動した扱いになる
        var defense = state.defense;
        if (d.which === "offense") {
            state.offense.probabilityBoosted = true;
        }
        else if (defense) {
            defense.probabilityBoosted = true;
        }
    }
    if (random(context, percent)) {
        context.log.log("\u30B9\u30AD\u30EB\u304C\u767A\u52D5\u3067\u304D\u307E\u3059 " + d.name + " \u78BA\u7387:" + percent + "%");
        return true;
    }
    else {
        context.log.log("\u30B9\u30AD\u30EB\u304C\u767A\u52D5\u3057\u307E\u305B\u3093\u3067\u3057\u305F " + d.name + " \u78BA\u7387:" + percent + "%");
        return false;
    }
}
/**
 * 確率計算モードを考慮してtrue/falseの条件を計算する
 *
 * {@link RandomMode} の値に応じて乱数計算を無視してtrue/falseを返す場合もある
 * 計算の詳細
 * 1. `percent <= 0` -> `false`
 * 2. `percent >= 100` -> `true`
 * 3. `context.random.mode === "ignore"` -> `false`
 * 4. `context.random.mode === "force"` -> `true`
 * 5. `context.random.mode === "normal"` -> 疑似乱数を用いて`percent`%の確率で`true`を返す
 * @param percent 100分率で指定した確率でtrueを返す
 * @returns
 */
function random(context, percent) {
    if (percent >= 100)
        return true;
    if (percent <= 0)
        return false;
    if (context.random.mode === "force") {
        context.log.log("確率計算は無視されます mode: force");
        return true;
    }
    if (context.random.mode === "ignore") {
        context.log.log("確率計算は無視されます mode: ignore");
        return false;
    }
    return context.random() < percent / 100.0;
}
exports.random = random;
/**
 * 発動したものの影響がなかった確率ブーストのスキルを発動しなかったことにする
 * @param d
 */
function checkProbabilityBoost(d) {
    if (!d.probabilityBoosted && d.probabilityBoostPercent !== 0) {
        d.triggeredSkills = d.triggeredSkills.filter(function (s) { return s.step !== "probability_check"; });
    }
}
/**
 * 被アクセス側が受けるダメージ値のうち`damage_common`までに計算される基本値を参照
 *
 * - `state.damageBase`が定義済みの場合はその値を返す
 * - 未定義の場合は {@link calcBaseDamage}で計算して返す
 */
function getBaseDamage(context, state, useAKT, useDEF, useAttr) {
    if (useAKT === void 0) { useAKT = true; }
    if (useDEF === void 0) { useDEF = true; }
    if (useAttr === void 0) { useAttr = true; }
    if (state.damageBase) {
        return state.damageBase;
    }
    return {
        variable: calcBaseDamage(context, state),
        constant: 0,
    };
}
exports.getBaseDamage = getBaseDamage;
/**
 * 被アクセス側が受けるダメージ値のうち`damage_common`までに計算される基本値を計算
 *
 * `AP * (100 + ATK - DEF)/100.0 * (damageRatio)`
 *
 * @param useAKT ATK増減を加味する default:`true`
 * @param useDEF DEF増減を加味する default:`true`
 * @param useAttr アクセス・被アクセス個体間の属性による倍率補正を加味する default:`true`
 * @returns
 */
function calcBaseDamage(context, state, useAKT, useDEF, useAttr) {
    if (useAKT === void 0) { useAKT = true; }
    if (useDEF === void 0) { useDEF = true; }
    if (useAttr === void 0) { useAttr = true; }
    var atk = 0;
    var def = 0;
    var ratio = 1.0;
    if (useAKT) {
        atk = state.attackPercent;
    }
    if (useDEF) {
        def = state.defendPercent;
    }
    if (useAttr) {
        ratio = state.damageRatio;
    }
    var base = getAccessDenco(state, "offense").ap;
    // ATK&DEF合計が0%未満になってもダメージ値は負数にはしない
    var damage = Math.max(1, Math.floor(base * (100 + atk - def) / 100.0 * ratio));
    context.log.log("\u57FA\u672C\u30C0\u30E1\u30FC\u30B8\u3092\u8A08\u7B97 AP:" + base + " ATK:" + atk + "% DEF:" + def + "% DamageBase:" + damage + " = " + base + " * " + (100 + atk - def) + "% * " + ratio);
    return damage;
}
exports.calcBaseDamage = calcBaseDamage;
/**
 * 攻守はそのままでアクセス処理を再度実行する
 *
 * @param state 現在のアクセス状態
 * @returns ダメージ計算・スコアと経験値の加算など各処理を再度実行して合計値を反映した新たな状態を返す
 */
function repeatAccess(context, state) {
    context.log.log("\u30A2\u30AF\u30BB\u30B9\u51E6\u7406\u3092\u518D\u5EA6\u5B9F\u884C #" + (state.depth + 1));
    var next = {
        time: state.time,
        station: state.station,
        offense: copyAccessSideState(state.offense),
        defense: state.defense ? copyAccessSideState(state.defense) : undefined,
        damageFixed: 0,
        attackPercent: 0,
        defendPercent: 0,
        damageRatio: 1.0,
        linkSuccess: false,
        linkDisconncted: false,
        pinkMode: false,
        pinkItemSet: false,
        pinkItemUsed: false,
        depth: state.depth + 1,
    };
    var result = execute(context, next, false);
    context.log.log("\u30A2\u30AF\u30BB\u30B9\u51E6\u7406\u3092\u7D42\u4E86 #" + (state.depth + 1));
    return result;
}
exports.repeatAccess = repeatAccess;
/**
 * カウンター攻撃を処理する
 *
 * 攻守を入れ替えて通常同様の処理を再度実行する
 *
 * @param context
 * @param state 現在の状態
 * @param denco カウンター攻撃の主体 現在の守備側である必要あり
 * @returns カウンター攻撃終了後の状態
 */
function counterAttack(context, current, denco) {
    var state = copyAccessState(current);
    // 面倒なので反撃は1回まで
    if (state.depth > 0) {
        context.log.warn("反撃は１回までだよ");
        return state;
    }
    if (hasDefense(state)) {
        var idx = state.defense.formation.findIndex(function (d) { return d.numbering === denco.numbering; });
        if (idx < 0) {
            context.log.error("\u53CD\u6483\u3059\u308B\u3067\u3093\u3053\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 " + denco.numbering + " " + denco.name);
            return state;
        }
        var next = {
            time: state.time,
            station: state.station,
            // 編成内の直接アクセスされた以外のでんこによる反撃の場合もあるため慎重に
            offense: turnSide(state.defense, "defense", idx),
            // 原則さっきまでのoffense
            defense: turnSide(state.offense, "offense", state.offense.carIndex),
            damageFixed: 0,
            attackPercent: 0,
            defendPercent: 0,
            damageRatio: 1.0,
            linkSuccess: false,
            linkDisconncted: false,
            pinkMode: false,
            pinkItemSet: false,
            pinkItemUsed: false,
            depth: state.depth + 1,
        };
        // カウンター実行
        context.log.log("攻守交代、カウンター攻撃を開始");
        var result = execute(context, next, false);
        context.log.log("カウンター攻撃を終了");
        if (!result.defense) {
            context.log.error("\u30AB\u30A6\u30F3\u30BF\u30FC\u653B\u6483\u306E\u7D50\u679C\u306B\u5B88\u5099\u5074\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
            throw Error();
        }
        // カウンター攻撃によるでんこ状態の反映 AccessDencoState[]
        state.offense = turnSide(result.defense, "defense", state.offense.carIndex);
        state.defense = turnSide(result.offense, "offense", state.defense.carIndex);
    }
    else {
        context.log.error("相手が存在しないので反撃はできません");
    }
    return state;
}
exports.counterAttack = counterAttack;
function turnSide(state, currentSide, nextAccessIdx) {
    var nextSide = currentSide === "defense" ? "offense" : "defense";
    var nextFormation = state.formation.map(function (s) {
        var next = __assign(__assign({}, s), { which: nextSide, who: s.carIndex === nextAccessIdx ? nextSide : "other" });
        return next;
    });
    return {
        user: state.user,
        carIndex: nextAccessIdx,
        formation: nextFormation,
        triggeredSkills: state.triggeredSkills,
        probabilityBoostPercent: state.probabilityBoostPercent,
        probabilityBoosted: state.probabilityBoosted,
        score: state.score,
        displayedScore: state.displayedScore,
        displayedExp: state.displayedExp,
    };
}
function completeDencoHP(context, state, which) {
    var _a;
    var side = which === "offense" ? state.offense : state.defense;
    (_a = side === null || side === void 0 ? void 0 : side.formation) === null || _a === void 0 ? void 0 : _a.forEach(function (d) {
        updateDencoHP(context, d);
        // 新しい状態のHPを決定
        if (d.reboot) {
            d.currentHp = d.maxHp;
        }
        else {
            d.currentHp = d.hpAfter;
        }
        if (d.who !== "other" || d.reboot || d.hpAfter !== d.hpBefore) {
            context.log.log("HP\u78BA\u5B9A " + d.name + " " + d.hpBefore + " > " + d.hpAfter + " reboot:" + d.reboot);
        }
    });
    return state;
}
/**
 * hpAfter = max{0, hpCurrecnt(default:hpBefore) - damage(if any)}
 * reboot = (hpAfter === 0)
 * @param context
 * @param d
 */
function updateDencoHP(context, d) {
    var _a, _b;
    // HPの決定
    var damage = (_b = (_a = d.damage) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
    if (d.hpBefore !== d.currentHp) {
        context.log.log("\u30C0\u30E1\u30FC\u30B8\u8A08\u7B97\u4EE5\u5916\u3067HP\u304C\u5909\u5316\u3057\u3066\u3044\u307E\u3059 " + d.name + " " + d.hpBefore + " > " + d.currentHp);
        if (d.currentHp < 0 || d.maxHp <= d.currentHp) {
            context.log.error("\u73FE\u5728\u306EHP\u306E\u5024\u304C\u4E0D\u6B63\u3067\u3059 range[0,maxHP]");
        }
    }
    d.hpAfter = Math.max(d.currentHp - damage, 0);
    // Reboot有無の確定
    d.reboot = (d.hpAfter === 0);
}
function completeDencoLink(context, state, which) {
    var side = which === "offense" ? state.offense : state.defense;
    // 編成全員のリンク解除を確認する
    side === null || side === void 0 ? void 0 : side.formation.map(function (d) {
        if (d.reboot) {
            // リブートにより全リンク解除
            var disconnetedLink = d.link;
            d.link = [];
            var linkResult = calcLinksResult(context, disconnetedLink, d, which);
            d.exp.link = linkResult.exp;
            d.disconnetedLink = linkResult;
            side.score.link = linkResult.totalScore;
            side.event.push({
                type: "reboot",
                data: linkResult,
            });
        }
        else if (d.who === "offense" && state.linkSuccess) {
            // 攻撃側のリンク成功
            d.link.push(__assign(__assign({}, state.station), { start: (0, context_1.getCurrentTime)(context).valueOf() }));
        }
        else if (d.who === "defense" && state.linkDisconncted) {
            // 守備側のリンク解除 フットバースなどリブートを伴わない場合
            var idx = d.link.findIndex(function (link) { return link.name === state.station.name; });
            if (idx < 0) {
                context.log.error("\u30EA\u30F3\u30AF\u89E3\u9664\u3057\u305F\u5B88\u5099\u5074\u306E\u30EA\u30F3\u30AF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 " + state.station.name);
                throw Error();
            }
            // 対象リンクのみ解除
            var disconnetedLink = d.link[idx];
            d.link.splice(idx, 1);
            var linkResult = calcLinksResult(context, [disconnetedLink], d, "defense");
            // 特にイベントは発生せず経験値だけ追加
            d.exp.link = linkResult.exp;
            d.disconnetedLink = linkResult;
            side.score.link = linkResult.totalScore;
        }
    });
    return state;
}
function completeDencoEXP(context, state, which) {
    var _a;
    var side = which === "offense" ? state.offense : state.defense;
    (_a = side === null || side === void 0 ? void 0 : side.formation) === null || _a === void 0 ? void 0 : _a.forEach(function (d) {
        // アクセスによる経験値付与
        var exp = d.exp.access + d.exp.skill + d.exp.link;
        if (d.who !== "other" || exp !== 0) {
            context.log.log("\u7D4C\u9A13\u5024\u8FFD\u52A0 " + d.name + " " + d.currentExp + "(current) + " + exp + " -> " + (d.currentExp + exp));
            context.log.log("\u7D4C\u9A13\u5024\u8A73\u7D30 access:" + d.exp.access + " skill:" + d.exp.skill + " link:" + d.exp.link);
        }
        d.currentExp += exp;
    });
    return state;
}
function completeDisplayScoreExp(context, state, which) {
    var side = which === "offense" ? state.offense : state.defense;
    if (side) {
        // 基本的には直接アクセスするでんこの経験値とスコア
        var d = side.formation[side.carIndex];
        side.displayedScore = side.score.access + side.score.skill;
        side.displayedExp = d.exp.access + d.exp.skill;
        // 守備側がリンク解除（フットバースorリブート）した場合はその駅のリンクのスコア＆経験値を表示
        if (state.linkDisconncted && d.who === "defense") {
            var idx = d.link.findIndex(function (l) { return l.name === state.station.name; });
            if (idx < 0) {
                context.log.error("\u30EA\u30D6\u30FC\u30C8\u3057\u305F\u5B88\u5099\u5074\u306E\u30EA\u30F3\u30AF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 " + state.station.name);
                throw Error();
            }
            var result = calcLinkResult(context, d.link[idx], d, 0);
            side.displayedScore += result.totatlScore;
            side.displayedExp += calcExp(result.totatlScore);
        }
    }
    return state;
}
