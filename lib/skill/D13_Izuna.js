"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var access_1 = require("../core/access");
var skill = {
    canEvaluate: function (context, state, step, self) {
        return step === "damage_common" && self.who === "defense";
    },
    evaluate: function (context, state, step, self) {
        // ディフェンダー数ごとに増加するDEF定数　
        var def = self.skill.propertyReader("DEF");
        // 編成内のディフェンダー数 self.who === "defense"
        var cnt = (0, access_1.getDefense)(state).formation.filter(function (d) { return d.type === "defender"; }).length;
        state.defendPercent += cnt * def;
        context.log.log("\u7DE8\u6210\u3092\u30C7\u30A3\u30D5\u30A7\u30F3\u30C0\u30FC\u3067\u56FA\u3081\u308B\u3068\u3068\u3063\u3066\u3082\u52B9\u679C\u7684\u306A\u306E\u3088\u266A DEF: " + def + "% * " + cnt + "(\u30C7\u30A3\u30D5\u30A7\u30F3\u30C0\u30FC\u6570) = " + def * cnt + "%");
        return state;
    }
};
exports.default = skill;
//# sourceMappingURL=D13_Izuna.js.map