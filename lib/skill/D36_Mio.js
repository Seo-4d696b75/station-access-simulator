"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "damage_special" &&
            self.which === "defense" &&
            self.who !== "defense" &&
            self.currentHp > 1) {
            var base = (0, __1.getBaseDamage)(context, state);
            // 肩代わりできるダメージの有無を確認
            if (base.variable > 0) {
                return self.skill.propertyReader("probability");
            }
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        // ATKのみ考慮して基本ダメージを計算
        var base = (0, __1.calcBaseDamage)(context, state, true, false, false);
        var cut = Math.min(self.currentHp - 1, base);
        if (cut <= 0) {
            context.log.error("\u80A9\u4EE3\u308F\u308A\u3059\u308B\u30C0\u30E1\u30FC\u30B8\u91CF\u304C0\u4EE5\u4E0B\u3067\u3059");
        }
        // DEF, 属性ダメージ補正をあとから乗算
        var def = state.defendPercent;
        var ratio = state.damageRatio;
        var damage = Math.max(Math.floor((base - cut) * (1 - def / 100) * ratio), 1 // 最低1ダメージ分は確保
        );
        context.log.log("\u30DF\u30AA\u306E\u30C0\u30E1\u30FC\u30B8\u80A9\u4EE3\u308F\u308A damage:" + cut + ", HP:" + self.currentHp + " => " + (self.currentHp - cut));
        context.log.log("\u30C0\u30E1\u30FC\u30B8\u8A08\u7B97 base:" + base + " = AP * (1 + ATK%), DEF:" + def + "%, damage:" + damage + " = max{1, (base - " + cut + ") * " + (100 - def) + "% * " + ratio + "}");
        // 肩代わり後のダメージ量で上書き
        state.damageBase = {
            variable: damage,
            constant: 0
        };
        // ミオにダメージ記録
        (0, __1.getDefense)(state).formation[self.carIndex].damage = {
            value: cut,
            attr: false
        };
        return state;
    },
    disactivateAt: function (context, state, self) {
        var active = self.skill.propertyReader("active");
        var wait = self.skill.propertyReader("wait");
        var now = (0, __1.getCurrentTime)(context);
        return {
            activeTimeout: now + active * 1000,
            cooldownTimeout: now + (active + wait) * 1000,
        };
    }
};
exports.default = skill;
