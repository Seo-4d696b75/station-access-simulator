"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAccessEvent = exports.formatAccessDetail = exports.formatRebootDetail = exports.formatReboot = exports.formatEvent = exports.printEvents = void 0;
var access_1 = require("./access");
var context_1 = require("./context");
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
    if (event.type === "access") {
        return detail ? formatAccessDetail(event.data.access, event.data.which, time) : formatAccessEvent(event.data.access, event.data.which, time);
    }
    else if (event.type === "reboot") {
        return detail ? formatRebootDetail(event.data, time) : formatReboot(event.data, time);
    }
    else {
        return event.type;
    }
}
exports.formatEvent = formatEvent;
function formatReboot(result, time, width) {
    if (width === void 0) { width = 40; }
    var str = "┏" + "━".repeat(width - 2) + "┓\n";
    str += formatLine("reboot", width);
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
    str += formatLine(formatPastTime(time, result.time), width);
    str = str + "┗" + "━".repeat(width - 2) + "┛";
    return str;
}
exports.formatReboot = formatReboot;
function formatRebootDetail(result, time, width) {
    if (width === void 0) { width = 50; }
    var str = "┏" + "━".repeat(width - 2) + "┓\n";
    str += formatLine("reboot", width);
    str += formatLine(result.denco.name + "\u304C\u30EA\u30F3\u30AF\u3057\u3066\u3044\u305F\u99C5\u306E\u30B9\u30B3\u30A2\u304C\u52A0\u7B97\u3055\u308C\u307E\u3057\u305F", width);
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    result.link.forEach(function (link) {
        str += "┃" + formatSpace(link.name, width - 10, "left");
        str += link.matchBonus ? formatAttr(result.denco.attr, 8) : " ".repeat(8);
        str += "┃\n";
        var duration = formatLinkTime(time, link);
        var pt = formatSpace(formatPt(link.totatlScore), width - 2 - len(duration), "right");
        str += "┃" + duration + pt + "┃\n";
        str += "┠" + "─".repeat(width - 2) + "┨\n";
    });
    str += "┃" + "total score" + formatSpace(formatPt(result.totalScore), width - 13, "right") + "┃\n";
    str += "┃" + "link score" + formatSpace(formatPt(result.linkScore), width - 12, "right") + "┃\n";
    str += "┃" + "combo bonus" + formatSpace(formatPt(result.comboBonus), width - 13, "right") + "┃\n";
    str += "┃" + "match bonus" + formatSpace(formatPt(result.matchBonus), width - 13, "right") + "┃\n";
    str += "┃" + formatSpace(result.denco.name + "'s exp " + formatPt(result.totalScore), width - 2, "right") + "┃\n";
    str += formatLine(formatPastTime(time, result.time), width);
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
    str += formatLine(title, width);
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
    if (which === "offense") {
        str += "╱" + "─".repeat(width - 4 - iconWidth * 2) + "┐";
    }
    else {
        str += "┌" + "─".repeat(width - 4 - iconWidth * 2) + "╲";
    }
    str += formatSpace(right.name, iconWidth) + "┃\n";
    str += "┃" + formatSpace(left ? "Lv." + left.level : "", iconWidth);
    if (which === "offense") {
        str += "╲" + "─".repeat(width - 4 - iconWidth * 2) + "┘";
    }
    else {
        str += "└" + "─".repeat(width - 4 - iconWidth * 2) + "╱";
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
    str += "┃" + formatSpace(formatPt(leftSide === null || leftSide === void 0 ? void 0 : leftSide.displayedScore), tableLeft, "left");
    str += " score";
    str += formatSpace(formatPt(rightSide.displayedScore), tableRight, "right") + "┃\n";
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    str += "┃" + formatSpace(formatPt(leftSide === null || leftSide === void 0 ? void 0 : leftSide.displayedExp), tableLeft, "left");
    str += "  exp ";
    str += formatSpace(formatPt(rightSide.displayedExp), tableRight, "right") + "┃\n";
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    var mes = "";
    if (which === "offense") {
        mes = result.linkSuccess ? right.name + "\u304C\u30EA\u30F3\u30AF\u3092\u958B\u59CB" : right.name + "\u304C\u30A2\u30AF\u30BB\u30B9";
    }
    else {
        mes = result.linkDisconncted ? right.name + "\u306E\u30EA\u30F3\u30AF\u304C\u89E3\u9664" : "リンク継続中";
    }
    str += formatLine(mes, width);
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
    str += formatLine(title, width);
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
    if (which === "offense") {
        str += "╱" + "─".repeat(width - 4 - iconWidth * 2) + "┐";
    }
    else {
        str += "┌" + "─".repeat(width - 4 - iconWidth * 2) + "╲";
    }
    str += formatSpace(right.name, iconWidth) + "┃\n";
    str += "┃" + formatSpace(left ? "Lv." + left.level : "", iconWidth);
    if (which === "offense") {
        str += "╲" + "─".repeat(width - 4 - iconWidth * 2) + "┘";
    }
    else {
        str += "└" + "─".repeat(width - 4 - iconWidth * 2) + "╱";
    }
    str += formatSpace("Lv." + right.level, iconWidth) + "┃\n";
    str += "┃" + formatSpace(left ? left.name + "\u306E\u30DE\u30B9\u30BF\u30FC" : "", iconWidth);
    str += formatSpace(formatPastTime(time, result.time), width - iconWidth * 2 - 2);
    str += formatSpace(right.name + "\u306E\u30DE\u30B9\u30BF\u30FC", iconWidth) + "┃\n";
    str += "┠" + "─".repeat(width - 2) + "┨\n";
    var mes = "";
    if (which === "offense") {
        mes = result.linkSuccess ? right.name + "\u304C\u30EA\u30F3\u30AF\u3092\u958B\u59CB" : right.name + "\u304C\u30A2\u30AF\u30BB\u30B9";
    }
    else {
        mes = result.linkDisconncted ? right.name + "\u306E\u30EA\u30F3\u30AF\u304C\u89E3\u9664" : "リンク継続中";
    }
    str += formatLine(mes, width);
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
    return d.value.toString();
}
function formatPt(pt) {
    if (!pt && pt !== 0)
        return "";
    return new Intl.NumberFormat().format(pt) + "pt";
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
    if (d.hpAfter === d.hpBefore) {
        return d.hpAfter + "/" + d.maxHp;
    }
    else {
        return d.hpBefore + ">>" + d.hpAfter + "/" + d.maxHp;
    }
}
function formatAttr(attr, width) {
    if (attr === "eco") {
        return " " + formatSpace("eco🌳", width) + " ";
    }
    else if (attr === "heat") {
        return " " + formatSpace("heat🔥", width) + " ";
    }
    else if (attr === "cool") {
        return " " + formatSpace("cool💧", width) + " ";
    }
    else {
        return " " + formatSpace("flat💿", width) + " ";
    }
}
var charStart = " ".charCodeAt(0);
var charEnd = "~".charCodeAt(0);
var charList = ["…".charCodeAt(0)];
function charLen(code) {
    if (charStart <= code && code <= charEnd)
        return 1;
    if (charList.includes(code))
        return 1;
    return 2;
}
function len(value) {
    var sum = 0;
    for (var i = 0; i < value.length; i++) {
        var code = value.charCodeAt(i);
        sum += charLen(code);
    }
    return sum;
}
function subString(value, width) {
    if (width < 0)
        return "";
    if (width === 1) {
        return len(value) === 1 ? value : "…";
    }
    var str = "";
    var length = 0;
    for (var i = 0; i < value.length; i++) {
        var code = value.charCodeAt(i);
        var v = charLen(code);
        if (length + v > width) {
            while (length + 1 > width) {
                code = str.charCodeAt(str.length - 1);
                v = charLen(code);
                length -= v;
                str = str.slice(0, -1);
            }
            return str + "…";
        }
        str += value.charAt(i);
        length += v;
    }
    return str;
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
function formatLine(value, width, end) {
    if (end === void 0) { end = "┃"; }
    var length = width - 2;
    return end + formatSpace(value, length) + end + "\n";
}
