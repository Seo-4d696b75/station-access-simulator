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
Object.defineProperty(exports, "__esModule", { value: true });
var access_1 = require("../core/access");
var context_1 = require("../core/context");
var skillEvent_1 = require("../core/skillEvent");
var skill = {
    onAccessComplete: function (context, state, self, access) {
        // アクセス前後で自編成個体のHPが変化して3割以下となった個体が対象
        // アクセス・被アクセス以外の個体もHPが変化するので自編成の全個体を注目
        var formation = (0, access_1.getFormation)(access, self.which);
        var target = formation.filter(function (d) { return d.hpBefore !== d.currentHp && d.currentHp <= d.maxHp * 0.3; });
        if (target.length > 0) {
            var percent = self.skill.property.readNumber("probability");
            var heal_1 = self.skill.property.readNumber("heal");
            // lambdaからAccessStateを参照
            var evaluate = function (context, state, self) {
                context.log.log("\u691C\u6E2C\u958B\u59CB\u3057\u307E\uFF5E\u3059 HP+" + heal_1);
                return __assign(__assign({}, state), { formation: state.formation.map(function (d) {
                        // 編成は変わらない前提
                        var before = formation[d.carIndex].hpBefore;
                        if (before !== d.currentHp && d.currentHp <= d.maxHp * 0.3) {
                            return __assign(__assign({}, d), { currentHp: Math.min(d.maxHp, d.currentHp + heal_1) });
                        }
                        else {
                            return d;
                        }
                    }) });
            };
            return (0, skillEvent_1.evaluateSkillAfterAccess)(context, state, self, percent, evaluate);
        }
    },
    disactivateAt: function (context, state, self) {
        var active = self.skill.property.readNumber("active");
        var wait = self.skill.property.readNumber("wait");
        var time = (0, context_1.getCurrentTime)(context);
        return {
            activeTimeout: time + active * 1000,
            cooldownTimeout: time + (active + wait) * 1000,
        };
    }
};
exports.default = skill;
