"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var skill = {
    canEvaluate: function (context, state, step, self) {
        return step === "damage_common" &&
            self.who === "offense" &&
            !!state.defense &&
            self.currentHp > 1;
    },
    evaluate: function (context, state, step, self) {
        var atk = self.skill.propertyReader("ATK");
        state.attackPercent += atk;
        // HPの半減はダメージとしては記録せずHPを直接操作する
        var d = state.offense.formation[self.carIndex];
        var currentHP = d.currentHp;
        var nextHP = Math.floor(currentHP / 2);
        d.currentHp = nextHP;
        context.log.log("\u30A4\u30E0\u30E9\u63A8\u3057\u3066\u53C2\u308B ATK+" + atk + "% HP:" + currentHP + "->" + nextHP);
        return state;
    },
    disactivateAt: function (context, state, self) {
        var now = (0, __1.getCurrentTime)(context);
        var active = self.skill.propertyReader("active");
        var wait = self.skill.propertyReader("wait");
        return {
            activeTimeout: now + active * 1000,
            cooldownTimeout: now + (active + wait) * 1000
        };
    }
};
exports.default = skill;
