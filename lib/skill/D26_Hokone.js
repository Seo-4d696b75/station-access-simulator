"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var access_1 = require("../core/access");
var context_1 = require("../core/context");
var skill = {
    canEvaluate: function (context, state, step, self) {
        return (step === "damage_common" || step === "damage_special")
            && self.who === "offense"
            && state.defense !== undefined;
    },
    evaluate: function (context, state, step, self) {
        var _a, _b;
        var defense = (0, access_1.getAccessDenco)(state, "defense");
        if (step === "damage_special" && defense.numbering === "25") {
            var heal = self.skill.property.readNumber("heal");
            var base = (0, access_1.calcBaseDamage)(context, state);
            // 通常のATK&DEF増減による計算を考慮する
            var value = Math.floor(base * heal / 100);
            // 回復量は負数のダメージ量として処理
            state.damageBase = {
                variable: 0,
                constant: -value + ((_b = (_a = state.damageBase) === null || _a === void 0 ? void 0 : _a.constant) !== null && _b !== void 0 ? _b : 0)
            };
            context.log.log("\u3046\u3089\u3089\u3061\u3083\u3093\u306F\u53EF\u611B\u304F\u3066\u601D\u308F\u305A\u3044\u3044\u5B50\u3044\u3044\u5B50\u3057\u3061\u3083\u3046\u308F\u3041\uFF5E\u266A \u56DE\u5FA9:" + value + " = base:" + base + " * " + heal + "%");
        }
        else if (step === "damage_common" && defense.numbering !== "25") {
            var atk = self.skill.property.readNumber("ATK");
            state.attackPercent += atk;
            context.log.log("\u4ECA\u65E5\u3082\u611B\u3059\u308B\u3046\u3089\u3089\u3061\u3083\u3093\u3092\u3072\u3068\u308A\u3058\u3081\u3059\u308B\u305F\u3081\u3001\u91CE\u66AE\u306A\u9023\u4E2D\u3092\u3075\u3063\u98DB\u3070\u3059\u308F\u3088! ATK+" + atk + "%");
        }
        return state;
    },
    disactivateAt: function (context, state, self) {
        var active = self.skill.property.readNumber("active");
        var wait = self.skill.property.readNumber("wait");
        var now = (0, context_1.getCurrentTime)(context);
        return {
            activeTimeout: now + active * 1000,
            cooldownTimeout: now + (active + wait) * 1000,
        };
    },
};
exports.default = skill;
