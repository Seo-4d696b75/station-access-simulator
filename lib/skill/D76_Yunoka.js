"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var access_1 = require("../core/access");
var context_1 = require("../core/context");
var skill = {
    canEvaluate: function (context, state, step, self) {
        return (step === "damage_common" || step === "after_damage")
            && self.who === "offense"
            && state.defense !== undefined;
    },
    evaluate: function (context, state, step, self) {
        if (step === "damage_common") {
            var atk = self.skill.property.readNumber("ATK");
            state.attackPercent += atk;
            context.log.log("\u304A\u3063\u3051\uFF5E\u304A\u3063\u3051\uFF5E\u306A\u3093\u3068\u304B\u306A\u308B\u306A\u308B\uFF5E ATK+" + atk + "%");
        }
        else if (step === "after_damage") {
            var defense = (0, access_1.getAccessDenco)(state, "defense");
            if (defense.hpAfter > 0) {
                // 相手のHPを0にできなかった場合
                var percent = self.skill.property.readNumber("heal");
                // 相手の最大HPの特定割合を回復
                //   参考：https://twitter.com/koh_nohito/status/1091286742550736896
                //   スキルの説明や公式の文言では何の値の割合なのか明記なし
                // ただし与えたダメージ量はそのままなので、合計では正のダメージ量となる場合もある
                var heal = Math.floor(defense.maxHp * percent / 100);
                // ダメージ計算は既に完了しているのでダメージ量に直接加算する
                var damage = defense.damage;
                if (!damage) {
                    context.log.error("\u76F8\u624B\u306E\u30C0\u30E1\u30FC\u30B8\u91CF\u304C\u8A08\u7B97\u3055\u308C\u3066\u3044\u307E\u305B\u3093 " + defense.name);
                    throw Error();
                }
                context.log.log("\u4F1A\u3063\u305F\u3067\u3093\u3053\u306B\u3082\u30DD\u30AB\u30DD\u30AB\u3057\u3066\u307B\u3057\uFF5E\u3088\u306D\u266A \u56DE\u5FA9:" + heal + " = maxHP:" + defense.maxHp + " * " + percent + "%");
                context.log.log("\u76F8\u624B(" + defense.name + ")\u306E\u30C0\u30E1\u30FC\u30B8\u91CF:" + (damage.value - heal) + " = " + damage.value + " - \u56DE\u5FA9:" + heal);
                defense.damage = {
                    value: damage.value - heal,
                    attr: damage.attr,
                };
            }
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
