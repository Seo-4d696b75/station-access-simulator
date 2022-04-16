"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAccessEvent = exports.formatAccessDetail = exports.formatRebootDetail = exports.formatReboot = exports.formatSkillTriggerEvent = exports.formatLevelup = exports.formatLevelupDetail = exports.formatEvent = exports.printEvents = void 0;
var access_1 = require("./access");
var context_1 = require("./context");
var meaw_1 = require("meaw");
function printEvents(context, user, detail) {
    if (detail === void 0) { detail = false; }
    if (!user)
        return;
    user.event.forEach(function (event) {
        console.log(formatEvent(context, event, detail));
    });
}
exports.printEvents = printEvents;
function formatEvent(context, event, detail) {
    if (detail === void 0) { detail = false; }
    var time = (0, context_1.getCurrentTime)(context).valueOf();
    switch (event.type) {
        case "access":
            return detail ? formatAccessDetail(event.data.access, event.data.which, time) : formatAccessEvent(event.data.access, event.data.which, time);
        case "reboot":
            return detail ? formatRebootDetail(event.data, time) : formatReboot(event.data, time);
        case "skill_trigger":
            return formatSkillTriggerEvent(event.data, time);
        case "levelup":
            return detail ? formatLevelupDetail(event.data, time) : formatLevelup(event.data, time);
    }
}
exports.formatEvent = formatEvent;
function formatLevelupDetail(event, time, width) {
    if (width === void 0) { width = 60; }
    var str = "┏" + "━".repeat(width - 2) + "┓\n";
    str += formatLine(color("level up!", "yellow"), width);
    str += formatLine(event.after.name + "\u304C\u30EC\u30D9\u30EB\u30A2\u30C3\u30D7\uFF01", width, "left");
    str += formatLine("Lv: " + event.before.level + " >> " + event.after.level, width, "left");
    str += formatLine("HP: " + event.before.maxHp + " >> " + event.after.maxHp, width, "left");
    str += formatLine("AP: " + event.before.ap + " >> " + event.after.ap, width, "left");
    if (event.before.skill.type !== "possess" && event.after.skill.type === "possess") {
        str += formatLine("スキルを獲得！", width, "left");
        str += formatLine(color(event.after.skill.name, "blue"), width, "left");
    }
    if (event.before.skill.type === "possess" && event.after.skill.type === "possess" && event.before.skill.level !== event.after.skill.level) {
        str += formatLine("スキルがパワーアップ！", width, "left");
        str += formatLine(color(event.before.skill.name, "white"), width, "left");
        str += formatLine(color(">> " + event.after.skill.name, "blue"), width, "left");
    }
    str += formatLine(color(formatPastTime(time, event.time), "yellow"), width);
    str = str + "┗" + "━".repeat(width - 2) + "┛";
    return str;
}
exports.formatLevelupDetail = formatLevelupDetail;
function formatLevelup(event, time, width) {
    if (width === void 0) { width = 40; }
    var str = "┏" + "━".repeat(width - 2) + "┓\n";
    str += formatLine(color("level up!", "yellow"), width);
    str += formatLine(event.after.name, width);
    str += formatLine("Lv." + event.after.level, width);
    str += formatLine(event.after.name + "\u304C\u30EC\u30D9\u30EB\u30A2\u30C3\u30D7\uFF01", width);
    str += formatLine("Lv: " + event.before.level + " >> " + event.after.level, width);
    if (event.before.skill.type !== "possess" && event.after.skill.type === "possess") {
        str += formatLine(color("スキルを獲得した！", "blue"), width);
    }
    if (event.before.skill.type === "possess" && event.after.skill.type === "possess" && event.before.skill.level !== event.after.skill.level) {
        str += formatLine(color("スキルがパワーアップした！", "blue"), width);
    }
    str += formatLine(color(formatPastTime(time, event.time), "yellow"), width);
    str = str + "┗" + "━".repeat(width - 2) + "┛";
    return str;
}
exports.formatLevelup = formatLevelup;
function formatSkillTriggerEvent(event, time, width) {
    if (width === void 0) { width = 40; }
    var str = "┏" + "━".repeat(width - 2) + "┓\n";
    str += formatLine(color("skill", "blue"), width);
    str += formatLine(event.denco.name, width);
    str += formatLine("Lv." + event.denco.level, width);
    str += formatLine("\u300C" + event.skillName + "\u300D", width);
    str += formatLine(event.denco.name + "\u306E\u30B9\u30AD\u30EB\u304C\u767A\u52D5\uFF01", width);
    str += formatLine(color(formatPastTime(time, event.time), "blue"), width);
    str = str + "┗" + "━".repeat(width - 2) + "┛";
    return str;
}
exports.formatSkillTriggerEvent = formatSkillTriggerEvent;
function formatReboot(result, time, width) {
    if (width === void 0) { width = 40; }
    var str = "┏" + "━".repeat(width - 2) + "┓\n";
    str += formatLine(color("reboot", "red"), width);
    str += formatLine(result.denco.name, width);
    str += formatLine("Lv." + result.denco.level, width);
    str += formatLine(result.denco.name + "\u306E\u30D0\u30C3\u30C6\u30EA\u30FC\u304C\u5207\u308C\u307E\u3057\u305F", width);
    if (result.link.length > 0) {
        str += "┠" + "─".repeat(width - 2) + "┨\n";
        str += formatLine("接続中のリンクが解除されます", width);
        var stations = result.link.map(function (e) { return e.name; }).join(",");
        var mes = "(" + stations + ")";
        if (len(mes) > width - 2) {
            var length_1 = width - 2 - len("( " + result.link.length + "\u99C5)");
            mes = "(" + subString(stations, length_1) + (" " + result.link.length + "\u99C5)");
        }
        str += formatLine(mes, width);
        str += "┠" + "─".repeat(width - 2) + "┨\n";
    }
    str += formatLine(result.denco.name + "\u518D\u8D77\u52D5\u3057\u307E\u3059\u2026", width);
    str += formatLine(color(formatPastTime(time, result.time), "red"), width);
    str = str + "┗" + "━".repeat(width - 2) + "┛";
    return str;
}
exports.formatReboot = formatReboot;
function formatRebootDetail(result, time, width) {
    if (width === void 0) { width = 60; }
    var str = "┏" + "━".repeat(width - 2) + "┓\n";
    str += formatLine(color("reboot", "red"), width);
    str += formatLine(result.denco.name + "\u304C\u30EA\u30F3\u30AF\u3057\u3066\u3044\u305F\u99C5\u306E\u30B9\u30B3\u30A2\u304C\u52A0\u7B97\u3055\u308C\u307E\u3057\u305F", width);
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    result.link.forEach(function (link) {
        str += "┃" + color(formatSpace(link.name, width - 10, "left"), "green");
        str += link.matchBonus ? formatAttr(result.denco.attr, 8) : " ".repeat(8);
        str += "┃\n";
        var duration = formatLinkTime(time, link);
        var pt = formatSpace(formatPt(link.totatlScore), width - 2 - len(duration), "right");
        str += "┃" + color(duration + pt, "green") + "┃\n";
        str += "┠" + "─".repeat(width - 2) + "┨\n";
    });
    str += "┃" + color("total score" + formatSpace(formatPt(result.totalScore), width - 13, "right"), "green") + "┃\n";
    str += "┃" + "link score" + formatSpace(result.link.length + "\u99C5 " + formatPt(result.linkScore), width - 12, "right") + "┃\n";
    str += "┃" + "combo bonus" + formatSpace(formatPt(result.comboBonus), width - 13, "right") + "┃\n";
    str += "┃" + "match bonus" + formatSpace(result.matchCnt + "\u99C5 " + formatPt(result.matchBonus), width - 13, "right") + "┃\n";
    str += "┃" + color(formatSpace(result.denco.name + "'s exp " + formatPt(result.totalScore), width - 2, "right"), "green") + "┃\n";
    str += formatLine(color(formatPastTime(time, result.time), "red"), width);
    str = str + "┗" + "━".repeat(width - 2) + "┛";
    return str;
}
exports.formatRebootDetail = formatRebootDetail;
function formatAccessDetail(result, which, time, width) {
    if (width === void 0) { width = 60; }
    var str = "┏" + "━".repeat(width - 2) + "┓\n";
    // アクセス結果の表示
    var title = "access";
    if (which === "offense" && result.linkSuccess) {
        title += "/connect";
    }
    else if (which === "defense" && result.linkDisconncted) {
        title += "/disconnect";
    }
    var titleColor = which === "offense" ? "green" : "red";
    str += formatLine(color(title, titleColor), width);
    str += formatLine(result.station.name, width);
    str += formatLine(result.station.nameKana, width);
    //which === "offense"
    var leftSide = result.defense;
    var rightSide = result.offense;
    var left = result.defense ? (0, access_1.getAccessDenco)(result, "defense") : null;
    var right = (0, access_1.getAccessDenco)(result, "offense");
    if (which === "defense" && result.defense) {
        right = (0, access_1.getAccessDenco)(result, "defense");
        left = (0, access_1.getAccessDenco)(result, "offense");
        rightSide = result.defense;
        leftSide = result.offense;
    }
    var iconWidth = 14;
    str += "┃" + formatSpace(left ? left.name : "不在", iconWidth);
    var arrowColor = result.pinkMode ? "magenta" : "green";
    if (which === "offense") {
        str += color("╱" + "─".repeat(width - 4 - iconWidth * 2) + "┐", arrowColor);
    }
    else {
        str += color("┌" + "─".repeat(width - 4 - iconWidth * 2) + "╲", arrowColor);
    }
    str += formatSpace(right.name, iconWidth) + "┃\n";
    str += "┃" + formatSpace(left ? "Lv." + left.level : "", iconWidth);
    if (which === "offense") {
        str += color("╲" + "─".repeat(width - 4 - iconWidth * 2) + "┘", arrowColor);
    }
    else {
        str += color("└" + "─".repeat(width - 4 - iconWidth * 2) + "╱", arrowColor);
    }
    str += formatSpace("Lv." + right.level, iconWidth) + "┃\n";
    str += "┃" + (left ? formatAttr(left.attr, iconWidth) : " ".repeat(iconWidth));
    str += formatSpace(formatPastTime(time, result.time), width - iconWidth * 2 - 2);
    str += formatAttr(right.attr, iconWidth) + "┃\n";
    var tableLeft = Math.floor((width - 6 - 2) / 2);
    var tableRight = width - 6 - 2 - tableLeft;
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    str += "┃" + formatSpace(left ? left.name + "\u306E\u30DE\u30B9\u30BF\u30FC" : "", tableLeft, "left");
    str += " user ";
    str += formatSpace(right.name + "\u306E\u30DE\u30B9\u30BF\u30FC", tableRight, "right") + "┃\n";
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    str += "┃" + formatSpace(formatSkills(leftSide), tableLeft, "left");
    str += " skill";
    str += formatSpace(formatSkills(rightSide), tableRight, "right") + "┃\n";
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    str += "┃" + formatSpace(formatDamage(left), tableLeft, "left");
    str += "damage";
    str += formatSpace(formatDamage(right), tableRight, "right") + "┃\n";
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    str += "┃" + formatSpace(formatHP(leftSide), tableLeft, "left");
    str += "  hp  ";
    str += formatSpace(formatHP(rightSide), tableRight, "right") + "┃\n";
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    str += "┃" + formatSpace(formatAccessLinkTime(result.station, time, leftSide), tableLeft, "left");
    str += " link ";
    str += formatSpace(formatAccessLinkTime(result.station, time, rightSide), tableRight, "right") + "┃\n";
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    str += "┃" + formatSpace(formatPt(leftSide === null || leftSide === void 0 ? void 0 : leftSide.displayedScore, true), tableLeft, "left");
    str += " score";
    str += formatSpace(formatPt(rightSide.displayedScore, true), tableRight, "right") + "┃\n";
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    str += "┃" + formatSpace(formatPt(leftSide === null || leftSide === void 0 ? void 0 : leftSide.displayedExp, true), tableLeft, "left");
    str += "  exp ";
    str += formatSpace(formatPt(rightSide.displayedExp, true), tableRight, "right") + "┃\n";
    if (which === "offense" && result.linkSuccess) {
        str += "┠" + "─".repeat(width - 2) + "┨\n";
        str += formatLine(color(right.name + "\u304C\u30EA\u30F3\u30AF\u3092\u958B\u59CB", "green"), width);
    }
    else if (which === "defense" && result.linkDisconncted) {
        str += "┠" + "─".repeat(width - 2) + "┨\n";
        str += formatLine(color(right.name + "\u306E\u30EA\u30F3\u30AF\u304C\u89E3\u9664", "red"), width);
    }
    else if (which === "defense" && !result.linkDisconncted) {
        str += "┠" + "─".repeat(width - 2) + "┨\n";
        str += formatLine(color("リンク継続中", "green"), width);
    }
    str = str + "┗" + "━".repeat(width - 2) + "┛";
    return str;
}
exports.formatAccessDetail = formatAccessDetail;
function formatAccessEvent(result, which, time, width) {
    if (width === void 0) { width = 50; }
    var str = "┏" + "━".repeat(width - 2) + "┓\n";
    // アクセス結果の表示
    var title = "access";
    if (which === "offense" && result.linkSuccess) {
        title += "/connect";
    }
    else if (which === "defense" && result.linkDisconncted) {
        title += "/disconnect";
    }
    var titleColor = which === "offense" ? "green" : "red";
    str += formatLine(color(title, titleColor), width);
    str += formatLine(result.station.name, width);
    str += formatLine(result.station.nameKana, width);
    //which === "offense"
    var left = result.defense ? (0, access_1.getAccessDenco)(result, "defense") : null;
    var right = (0, access_1.getAccessDenco)(result, "offense");
    if (which === "defense" && result.defense) {
        right = (0, access_1.getAccessDenco)(result, "defense");
        left = (0, access_1.getAccessDenco)(result, "offense");
    }
    var iconWidth = 14;
    str += "┃" + formatSpace(left ? left.name : "不在", iconWidth);
    var arrowColor = result.pinkMode ? "magenta" : "green";
    if (which === "offense") {
        str += color("╱" + "─".repeat(width - 4 - iconWidth * 2) + "┐", arrowColor);
    }
    else {
        str += color("┌" + "─".repeat(width - 4 - iconWidth * 2) + "╲", arrowColor);
    }
    str += formatSpace(right.name, iconWidth) + "┃\n";
    str += "┃" + formatSpace(left ? "Lv." + left.level : "", iconWidth);
    if (which === "offense") {
        str += color("╲" + "─".repeat(width - 4 - iconWidth * 2) + "┘", arrowColor);
    }
    else {
        str += color("└" + "─".repeat(width - 4 - iconWidth * 2) + "╱", arrowColor);
    }
    str += formatSpace("Lv." + right.level, iconWidth) + "┃\n";
    str += "┃" + formatSpace(left ? left.name + "\u306E\u30DE\u30B9\u30BF\u30FC" : "", iconWidth);
    str += formatSpace(formatPastTime(time, result.time), width - iconWidth * 2 - 2);
    str += formatSpace(right.name + "\u306E\u30DE\u30B9\u30BF\u30FC", iconWidth) + "┃\n";
    if (which === "offense" && result.linkSuccess) {
        str += "┠" + "─".repeat(width - 2) + "┨\n";
        str += formatLine(color(right.name + "\u304C\u30EA\u30F3\u30AF\u3092\u958B\u59CB", "green"), width);
    }
    else if (which === "defense" && result.linkDisconncted) {
        str += "┠" + "─".repeat(width - 2) + "┨\n";
        str += formatLine(color(right.name + "\u306E\u30EA\u30F3\u30AF\u304C\u89E3\u9664", "red"), width);
    }
    else if (which === "defense" && !result.linkDisconncted) {
        str += "┠" + "─".repeat(width - 2) + "┨\n";
        str += formatLine(color("リンク継続中", "green"), width);
    }
    str = str + "┗" + "━".repeat(width - 2) + "┛";
    return str;
}
exports.formatAccessEvent = formatAccessEvent;
function formatDamage(state) {
    if (!state)
        return "";
    var d = state.damage;
    if (!d)
        return "-";
    if (d.value >= 0) {
        return color(d.value.toString(), "red");
    }
    else {
        return color((-d.value).toString(), "green");
    }
}
function formatPt(pt, colored) {
    if (colored === void 0) { colored = false; }
    if (!pt && pt !== 0)
        return "";
    if (pt === 0)
        return "0pt";
    var str = pt + "pt";
    if (!colored)
        return str;
    return color(str, "green");
}
function formatLinkTime(time, link) {
    if (!link)
        return "";
    var duration = time - link.start;
    if (duration < 0)
        return "";
    duration = Math.floor(duration / 1000);
    var str = duration % 60 + "\u79D2";
    duration = Math.floor(duration / 60);
    if (duration === 0)
        return str;
    str = duration % 60 + "\u5206" + str;
    duration = Math.floor(duration / 60);
    if (duration === 0)
        return str;
    str = duration % 24 + "\u6642\u9593" + str;
    duration = Math.floor(duration / 24);
    if (duration === 0)
        return str;
    str = duration + "\u65E5" + str;
    return str;
}
function formatAccessLinkTime(station, time, state) {
    if (!state)
        return "";
    var d = state.formation[state.carIndex];
    if (d.who === "defense") {
        var link = d.link.find(function (link) { return link.name === station.name; });
        if (link)
            return formatLinkTime(time, link);
    }
    return "-";
}
function formatSkills(state) {
    if (!state)
        return "";
    var skills = state.triggeredSkills;
    if (skills.length === 0)
        return "-";
    return skills.map(function (s) { return s.name; }).join(",");
}
function formatHP(state) {
    if (!state)
        return "";
    var d = state.formation[state.carIndex];
    if (d.damage === undefined) {
        return d.hpAfter + "/" + d.maxHp;
    }
    else {
        var c = d.damage.value >= 0 ? "red" : "green";
        return d.hpBefore + ">>" + color(d.hpAfter.toString(), c) + "/" + d.maxHp;
    }
}
function formatAttr(attr, width) {
    if (attr === "eco") {
        return formatSpace("eco🌳", width);
    }
    else if (attr === "heat") {
        return formatSpace("heat🔥", width);
    }
    else if (attr === "cool") {
        return formatSpace("cool💧", width);
    }
    else {
        return formatSpace("flat💿", width);
    }
}
function len(value) {
    value = value.replace(/\x1b\[[0-9]+m/g, "");
    return (0, meaw_1.computeWidth)(value);
}
/**
 * 文字列を指定した幅長以下にする
 * @returns 指定した幅長を超える場合は末尾を省略する
 */
function subString(value, width) {
    if (width < 0)
        return "";
    var suffix = "…";
    var suffixLen = len(suffix);
    var origin = value;
    value = origin.replace(/\x1b\[[0-9]+m/g, "");
    var str = "";
    var length = 0;
    for (var i = 0; i < value.length; i++) {
        var c = value.charAt(i);
        var v = len(c);
        if (length + v > width) {
            while (length + suffixLen > width) {
                c = str.charAt(str.length - 1);
                v = len(c);
                length -= v;
                str = str.slice(0, -1);
            }
            return str + suffix;
        }
        str += value.charAt(i);
        length += v;
    }
    var controls = origin.match(/\x1b\[[0-9]+m/g);
    if (!controls)
        return str;
    var result = "";
    for (var i = 0; i < origin.length && str.length > 0;) {
        var char = str.charAt(0);
        var originChar = origin.charAt(i);
        if (char === originChar) {
            result += char;
            str = str.substring(1);
            i++;
        }
        else if (originChar === "\x1b") {
            var control = controls[0];
            controls.splice(0, 1);
            result += control;
            i += control.length;
        }
        else if (char === suffix) {
            result += "…";
            str = str.substring(1);
        }
        else {
            throw Error();
        }
    }
    result = controls.reduce(function (a, b) { return a + b; }, result);
    return result;
}
function formatPastTime(now, time) {
    var sec = Math.floor((now - time) / 1000);
    if (sec < 10) {
        return "数秒前";
    }
    if (sec < 60) {
        return "数十秒前";
    }
    var min = Math.floor(sec / 60);
    if (min < 60) {
        return min + "\u5206\u524D";
    }
    var hour = Math.floor(min / 60);
    return hour + "\u6642\u9593" + min % 60 + "\u5206\u524D";
}
function formatSpace(value, width, gravity) {
    if (gravity === void 0) { gravity = "center"; }
    value = subString(value, width);
    var space = width - len(value);
    var v = Math.floor(space / 2);
    if (gravity === "left") {
        v = 0;
    }
    else if (gravity === "right") {
        v = space;
    }
    return " ".repeat(v) + value + " ".repeat(space - v);
}
function formatLine(value, width, gravity, end) {
    if (gravity === void 0) { gravity = "center"; }
    if (end === void 0) { end = "┃"; }
    var length = width - 2;
    return end + formatSpace(value, length, gravity) + end + "\n";
}
var COLOR_CONTROLS = {
    black: '\u001b[30m',
    red: '\u001b[31m',
    green: '\u001b[32m',
    yellow: '\u001b[33m',
    blue: '\u001b[34m',
    magenta: '\u001b[35m',
    cyan: '\u001b[36m',
    white: '\u001b[37m'
};
function color(value, color) {
    return "" + COLOR_CONTROLS[color] + value + "\u001B[00m";
}
