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
Object.defineProperty(exports, "__esModule", { value: true });
exports.counterAttack = exports.repeatAccess = exports.random = exports.hasSkillTriggered = exports.getDefense = exports.getAccessDenco = exports.getFormation = exports.copyAccessState = exports.startAccess = void 0;
var denco_1 = require("./denco");
var skill_1 = require("./skill");
var context_1 = require("./context");
var user_1 = require("./user");
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
function initAccessDencoState(context, f, which) {
    var formation = (0, skill_1.refreshSkillState)(context, f).formation.map(function (e, idx) {
        var s = __assign(__assign({}, e), { hpBefore: e.currentHp, hpAfter: e.currentHp, which: which, who: idx === f.carIndex ? which : "other", carIndex: idx, reboot: false, skillInvalidated: false, damage: undefined, accessEXP: 0 });
        return s;
    });
    var d = formation[f.carIndex];
    if (!d) {
        context.log.error("\u5BFE\u8C61\u306E\u3067\u3093\u3053\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 side: " + which + " carIndex: " + f.carIndex + ", formation.legth: " + formation.length);
    }
    return {
        carIndex: f.carIndex,
        formation: formation,
        triggeredSkills: [],
        probabilityBoostPercent: 0,
        probabilityBoosted: false,
        accessScore: 0,
        score: 0,
        exp: 0,
    };
}
function startAccess(context, config) {
    context = (0, context_1.fixClock)(context);
    var time = (0, context_1.getCurrentTime)(context);
    context.log.log("\u30A2\u30AF\u30BB\u30B9\u51E6\u7406\u306E\u958B\u59CB " + new Date(time).toTimeString());
    var state = {
        time: time,
        station: config.station,
        offense: initAccessDencoState(context, config.offense, "offense"),
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
        state.defense = initAccessDencoState(context, config.defense, "defense");
        var d_1 = getAccessDenco(state, "defense");
        var link = d_1.link.find(function (link) { return link.name === config.station.name; });
        if (!link) {
            context.log.warn("\u5B88\u5099\u5074(" + d_1.name + ")\u306E\u30EA\u30F3\u30AF\u306B\u5BFE\u8C61\u99C5(" + config.station.name + ")\u304C\u542B\u307E\u308C\u3066\u3044\u307E\u305B\u3093,\u8FFD\u52A0\u3057\u307E\u3059");
            link = __assign(__assign({}, config.station), { start: (0, context_1.getCurrentTime)(context) - 100 });
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
        skipDamageFixed: state.skipDamageFixed,
        pinkItemSet: state.pinkItemSet,
        pinkItemUsed: state.pinkItemUsed,
        pinkMode: state.pinkMode,
        linkSuccess: state.linkSuccess,
        linkDisconncted: state.linkDisconncted,
        offense: copySideState(state.offense),
        defense: state.defense ? copySideState(state.defense) : undefined,
        depth: state.depth,
    };
}
exports.copyAccessState = copyAccessState;
function copyAccessDencoState(state) {
    return __assign(__assign({}, (0, denco_1.copyDencoState)(state)), { which: state.which, who: state.who, carIndex: state.carIndex, hpBefore: state.hpBefore, hpAfter: state.hpAfter, reboot: state.reboot, skillInvalidated: state.skillInvalidated, damage: state.damage ? __assign({}, state.damage) : undefined, accessEXP: state.accessEXP });
}
function copySideState(state) {
    return {
        carIndex: state.carIndex,
        accessScore: state.accessScore,
        probabilityBoostPercent: state.probabilityBoostPercent,
        probabilityBoosted: state.probabilityBoosted,
        formation: Array.from(state.formation).map(function (d) { return copyAccessDencoState(d); }),
        triggeredSkills: Array.from(state.triggeredSkills),
        score: state.score,
        exp: state.exp,
    };
}
function completeAccess(context, config, access) {
    // このアクセスイベントの追加
    var offense = __assign(__assign({}, (0, user_1.copyUserState)(config.offense)), { event: __spreadArray(__spreadArray([], config.offense.event, true), [
            {
                type: "access",
                data: {
                    access: access,
                    which: "offense"
                }
            }
        ], false), carIndex: config.offense.carIndex });
    offense = copyFromAccessState(context, offense, access, "offense");
    var defense = undefined;
    if (access.defense && config.defense) {
        defense = __assign(__assign({}, (0, user_1.copyUserState)(config.defense)), { event: __spreadArray(__spreadArray([], config.defense.event, true), [
                {
                    type: "access",
                    data: {
                        access: access,
                        which: "defense"
                    }
                },
            ], false), carIndex: config.defense.carIndex });
        defense = copyFromAccessState(context, defense, access, "defense");
    }
    var result = {
        offense: offense,
        defense: defense,
        access: access
    };
    // レベルアップ処理
    result = checkLevelup(context, result);
    // アクセス直後のスキル発動イベント
    result = checkSKillState(context, result);
    result.offense = checkSkillAfterAccess(context, result.offense, access, "offense");
    result.defense = result.defense ? checkSkillAfterAccess(context, result.defense, access, "defense") : undefined;
    result = checkSKillState(context, result);
    return result;
}
function checkSkillAfterAccess(context, state, access, which) {
    var side = (which === "offense") ? access.offense : access.defense;
    if (!side)
        return state;
    filterActiveSkill(side.formation).forEach(function (idx) {
        var d = copyAccessDencoState(getFormation(access, which)[idx]);
        var skill = d.skillHolder.skill;
        var predicate = skill === null || skill === void 0 ? void 0 : skill.onAccessComplete;
        if (skill && predicate) {
            var self_1 = __assign(__assign({}, d), { skill: skill, skillPropertyReader: skill.propertyReader });
            var next = predicate(context, state, self_1, access);
            if (next) {
                state = __assign(__assign({}, next), { carIndex: state.carIndex });
            }
        }
    });
    return state;
}
function calcLinkResult(context, link, d) {
    var time = (0, context_1.getCurrentTime)(context);
    var duration = time - link.start;
    if (duration < 0) {
        context.log.error("\u30EA\u30F3\u30AF\u6642\u9593\u304C\u8CA0\u6570\u3067\u3059 " + duration + "[ms] " + JSON.stringify(link));
        throw Error("link duration < 0");
    }
    var attr = (link.attr === d.attr);
    var score = Math.floor(duration / 100);
    return __assign(__assign({}, link), { end: time, duration: duration, score: score, matchBonus: attr ? Math.floor(score * 0.3) : undefined });
}
function calcLinksResult(context, links, d, which) {
    var time = (0, context_1.getCurrentTime)(context);
    var linkResult = links.map(function (link) { return calcLinkResult(context, link, d); });
    // TODO combo bonus の計算
    var linkScore = linkResult.map(function (link) { return link.score; }).reduce(function (a, b) { return a + b; }, 0);
    var match = linkResult.map(function (link) { return link.matchBonus; }).filter(function (e) { return !!e; });
    var matchBonus = match.reduce(function (a, b) { return a + b; }, 0);
    var totalScore = linkScore + matchBonus;
    // TODO 経験値の計算
    var exp = totalScore;
    var result = {
        time: time,
        denco: (0, denco_1.copyDencoState)(d),
        which: which,
        totalScore: totalScore,
        linkScore: linkScore,
        comboBonus: 0,
        matchBonus: matchBonus,
        matchCnt: match.length,
        exp: exp,
        link: linkResult,
    };
    return result;
}
function copyFromAccessState(context, state, access, which) {
    var side = (which === "offense") ? access.offense : access.defense;
    if (!side)
        return state;
    // 編成全員を確認する
    var nextFormation = side.formation.map(function (d, idx) {
        var next = (0, denco_1.copyDencoState)(d);
        if (d.reboot) {
            if (d.link.length !== 0) {
                context.log.error("リンク解除処理の失敗");
            }
            var beforeAccess = state.formation[idx];
            var result = calcLinksResult(context, beforeAccess.link, d, which);
            next.currentExp += result.exp;
            state.event.push({
                type: "reboot",
                data: result,
            });
        }
        return next;
    });
    state.formation = nextFormation;
    return state;
}
function checkSKillState(context, result) {
    result.offense = __assign(__assign({}, (0, skill_1.refreshSkillState)(context, result.offense)), { carIndex: result.offense.carIndex });
    if (result.defense) {
        result.defense = __assign(__assign({}, (0, skill_1.refreshSkillState)(context, result.defense)), { carIndex: result.defense.carIndex });
    }
    return result;
}
function checkLevelup(context, result) {
    result.offense = __assign(__assign({}, (0, user_1.refreshEXPState)(context, result.offense)), { carIndex: result.offense.carIndex });
    if (result.defense) {
        result.defense = __assign(__assign({}, (0, user_1.refreshEXPState)(context, result.defense)), { carIndex: result.defense.carIndex });
    }
    return result;
}
function getDenco(state, which) {
    var s = which === "offense" ? state.offense : getDefense(state);
    return s.formation[s.carIndex];
}
function getFormation(state, which) {
    if (which === "offense") {
        return state.offense.formation;
    }
    else {
        return getDefense(state).formation;
    }
}
exports.getFormation = getFormation;
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
function getDefense(state) {
    var s = state.defense;
    if (!s) {
        throw Error("守備側が見つかりません");
    }
    return s;
}
exports.getDefense = getDefense;
function execute(context, state, top) {
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
    }
    // TODO アクセスによるスコアと経験値
    getAccessDenco(state, "offense").accessEXP += 100;
    state.offense.accessScore += 100;
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
            var base = getDenco(state, "offense").ap;
            context.log.log("\u57FA\u672C\u30C0\u30E1\u30FC\u30B8\u3092\u8A08\u7B97 AP:" + base);
            state.damageBase = calcBaseDamage(context, state, base);
        }
        // 固定ダメージの計算
        if (state === null || state === void 0 ? void 0 : state.skipDamageFixed) {
            context.log.log("固定ダメージの計算：スキップ");
        }
        else {
            context.log.log("スキルを評価：固定ダメージ");
            state = evaluateSkillAt(context, state, "damage_fixed");
            context.log.log("\u56FA\u5B9A\u30C0\u30E1\u30FC\u30B8\u306E\u8A08\u7B97\uFF1A" + state.damageFixed);
        }
        // 最終ダメージ計算 固定ダメージ等の影響でも負数にはならない
        var defense = getAccessDenco(state, "defense");
        var damageBase = state.damageBase;
        if (!damageBase) {
            context.log.error("基本ダメージの値が見つかりません");
            throw Error("base damage not set");
        }
        var damage = addDamage(defense.damage, {
            value: Math.max(damageBase + state.damageFixed, 0),
            attr: state.damageRatio !== 1.0
        });
        context.log.log("\u30C0\u30E1\u30FC\u30B8\u8A08\u7B97\u304C\u7D42\u4E86\uFF1A" + damage.value);
        // 攻守ふたりに関してアクセス結果を仮決定
        defense.damage = damage;
        // HP0 になったらリブート
        defense.hpAfter = Math.max(defense.hpBefore - damage.value, 0);
        defense.reboot = damage.value >= defense.hpBefore;
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
        // アクセスによる経験値の反映
        state = completeDencoAccessEXP(context, state, "offense");
        state = completeDencoAccessEXP(context, state, "defense");
        // 表示用の経験値＆スコアの計算
        state = completeDisplayScoreExp(context, state, "offense");
        state = completeDisplayScoreExp(context, state, "defense");
        // 各でんこのリンク状態を計算
        state = completeDencoLink(context, state, "offense");
        state = completeDencoLink(context, state, "defense");
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
        var skill = d.skillHolder.skill;
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
            var skill = d.skillHolder.skill;
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
        var s = d.skillHolder;
        return hasActiveSkill(d);
    }).map(function (d) { return d.carIndex; });
}
/**
 * アクセス中のスキル無効化の影響も考慮してアクティブなスキルか判定
 * @param d
 * @returns
 */
function hasActiveSkill(d) {
    return isSkillActive(d.skillHolder) && !d.skillInvalidated;
}
/**
 * スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
 * @param skill
 * @returns
 */
function isSkillActive(skill) {
    return skill.type === "possess" && skill.skill.state.type === "active";
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
    }
    if (random(context, percent)) {
        context.log.log("\u30B9\u30AD\u30EB\u304C\u767A\u52D5\u3067\u304D\u307E\u3059 " + d.name + " \u78BA\u7387:" + percent + "%");
        if (boost !== 0) {
            var defense = state.defense;
            if (d.which === "offense") {
                state.offense.probabilityBoosted = true;
            }
            else if (defense) {
                defense.probabilityBoosted = true;
            }
        }
        return true;
    }
    else {
        context.log.log("\u30B9\u30AD\u30EB\u304C\u767A\u52D5\u3057\u307E\u305B\u3093\u3067\u3057\u305F " + d.name + " \u78BA\u7387:" + percent + "%");
        return false;
    }
}
/**
 * 確率ブーストも考慮して確率を乱数を計算する
 * @param percent 100分率で指定した確立でtrueを返す
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
 * 被アクセス側が受けるダメージ値のうち DAMAGE_COMMONまでに計算される基本値を参照
 * @param base APなど増減前のダメージ値
 * @param useAKT ATK増減を加味する
 * @param useDEF DEF増減を加味する
 * @param useAttr アクセス・被アクセス個体間の属性による倍率補正を加味する
 * @returns base * (100 + ATK - DEF)/100.0 * (attr_damage_ratio) = damage
 */
function calcBaseDamage(context, state, base, useAKT, useDEF, useAttr) {
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
    var damage = Math.floor(base * (100 + atk - def) / 100.0 * ratio);
    context.log.log("\u57FA\u672C\u30C0\u30E1\u30FC\u30B8\u3092\u8A08\u7B97 ATK:" + atk + "% DEF:" + def + "% " + base + " * " + (100 + atk - def) + "% * " + ratio + " = " + damage);
    return damage;
}
/**
 * 攻守はそのままでアクセス処理を再度実行する
 *
 * ダメージ計算・スコアと経験値の加算など各処理を再度実行して合計値を反映した新たな状態を返す
 */
function repeatAccess(context, state) {
    context.log.log("\u30A2\u30AF\u30BB\u30B9\u51E6\u7406\u3092\u518D\u5EA6\u5B9F\u884C #" + (state.depth + 1));
    var next = {
        time: state.time,
        station: state.station,
        offense: copySideState(state.offense),
        defense: state.defense ? copySideState(state.defense) : undefined,
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
        carIndex: nextAccessIdx,
        formation: nextFormation,
        triggeredSkills: state.triggeredSkills,
        probabilityBoostPercent: state.probabilityBoostPercent,
        probabilityBoosted: state.probabilityBoosted,
        accessScore: state.accessScore,
        score: state.score,
        exp: state.exp,
    };
}
function completeDencoHP(context, state, which) {
    var _a;
    var side = which === "offense" ? state.offense : state.defense;
    (_a = side === null || side === void 0 ? void 0 : side.formation) === null || _a === void 0 ? void 0 : _a.forEach(function (d) {
        var _a, _b;
        // HPの確定
        var damage = (_b = (_a = d.damage) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
        d.hpAfter = Math.max(d.hpBefore - damage, 0);
        // Reboot有無の確定
        d.reboot = (d.hpAfter === 0);
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
function completeDencoLink(context, state, which) {
    var _a;
    var side = which === "offense" ? state.offense : state.defense;
    (_a = side === null || side === void 0 ? void 0 : side.formation) === null || _a === void 0 ? void 0 : _a.forEach(function (d) {
        // リンク追加・解除
        if (d.reboot) {
            // リブートは全リンク解除
            d.link = [];
        }
        else if (d.who === "offense" && state.linkSuccess) {
            // 攻撃側のリンク成功
            d.link.push(__assign(__assign({}, state.station), { start: (0, context_1.getCurrentTime)(context) }));
        }
        else if (d.who === "defense" && state.linkDisconncted) {
            // 守備側のリンク解除 フットバースなどリブートを伴わない場合
            var idx = d.link.findIndex(function (link) { return link.name === state.station.name; });
            if (idx < 0) {
                context.log.error("\u30EA\u30F3\u30AF\u89E3\u9664\u3057\u305F\u5B88\u5099\u5074\u306E\u30EA\u30F3\u30AF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 " + state.station.name);
                throw Error();
            }
            d.link.splice(idx, 1);
        }
    });
    return state;
}
function completeDencoAccessEXP(context, state, which) {
    var _a;
    var side = which === "offense" ? state.offense : state.defense;
    (_a = side === null || side === void 0 ? void 0 : side.formation) === null || _a === void 0 ? void 0 : _a.forEach(function (d) {
        if (d.who === "defense" && state.linkDisconncted && !d.reboot) {
            // 守備側のリンク解除 フットバースなどリブートを伴わない場合
            var idx = d.link.findIndex(function (link) { return link.name === state.station.name; });
            if (idx < 0) {
                context.log.error("\u30EA\u30F3\u30AF\u89E3\u9664\u3057\u305F\u5B88\u5099\u5074\u306E\u30EA\u30F3\u30AF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 " + state.station.name);
                throw Error();
            }
            // 特にイベントは発生せず経験値だけ追加
            var result = calcLinkResult(context, d.link[idx], d);
            // 例外的にリブートを伴わないリンク解除の場合は、リンクスコア＆経験値がアクセスのスコア＆経験値として加算
            d.accessEXP += result.score;
            side.accessScore += result.score;
        }
        // アクセスによる経験値付与
        if (d.who !== "other" || d.accessEXP !== 0) {
            context.log.log("\u7D4C\u9A13\u5024\u8FFD\u52A0 " + d.name + " " + d.currentExp + " + " + d.accessEXP);
        }
        d.currentExp += d.accessEXP;
    });
    return state;
}
function completeDisplayScoreExp(context, state, which) {
    var side = which === "offense" ? state.offense : state.defense;
    if (side) {
        // 基本的には直接アクセスするでんこの経験値とスコア
        var d = side.formation[side.carIndex];
        side.score = side.accessScore;
        side.exp = d.accessEXP;
        // 守備側がリブートした場合はその駅のリンクのスコア＆経験値を表示
        if (d.reboot && d.who === "defense") {
            var idx = d.link.findIndex(function (l) { return l.name === state.station.name; });
            if (idx < 0) {
                context.log.error("\u30EA\u30D6\u30FC\u30C8\u3057\u305F\u5B88\u5099\u5074\u306E\u30EA\u30F3\u30AF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 " + state.station.name);
                throw Error();
            }
            var result = calcLinkResult(context, d.link[idx], d);
            // アクセスの経験値として加算はするが、でんこ状態への反映はしない checkRebootLinksでまとめて加算
            side.score += result.score;
            side.exp += result.score;
        }
    }
    return state;
}
//# sourceMappingURL=access.js.map