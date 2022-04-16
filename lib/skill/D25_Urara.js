"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../core/context");
var skillEvent_1 = require("../core/skillEvent");
var skill = {
    canEnabled: function (context, state, self) {
        // 編成内（自身除く）にスキル状態が cooldownのでんこが１体以上いる
        return state.formation.some(function (d) {
            var s = d.skill;
            return s.type === "possess" && s.state.type === "cooldown";
        });
    },
    onActivated: function (context, state, self) {
        // スキルが有効化した瞬間にスキル発動
        var trigger = self.skill.property.readNumber("probability");
        return (0, skillEvent_1.evaluateSkillAtEvent)(context, state, self, trigger, evaluate);
    },
    disactivateAt: function (context, state, self) {
        var active = self.skill.property.readNumber("active"); // 0ms
        var wait = self.skill.property.readNumber("wait");
        var now = (0, context_1.getCurrentTime)(context);
        return {
            activeTimeout: now + active * 1000,
            cooldownTimeout: now + (active + wait) * 1000,
        };
    },
};
// スキル発動時の処理内容
var evaluate = function (context, state, self) {
    var target = state.formation.filter(function (d) {
        var s = d.skill;
        return s.type === "possess" && s.state.type === "cooldown";
    });
    if (target.length === 0) {
        context.log.error("cooldown\u30B9\u30AD\u30EB\u72B6\u614B\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    }
    var names = target.map(function (d) { return d.name; }).join(",");
    state.formation.forEach(function (d) {
        var s = d.skill;
        if (s.type === "possess" && s.state.type === "cooldown") {
            s.state = {
                // transitionタイプによってスキル状態の処理は異なる
                // 未初期化に戻してrefreshStateで初期化することでcooldown状態を強制終了する
                type: "not_init",
                transition: s.state.transition,
                data: undefined
            };
        }
    });
    context.log.log("\u30AF\u30FC\u30EB\u30BF\u30A4\u30E0\u304B\u3044\u3058\u3087\u3067\u304D\u308B\u3002\u30B9\u30AD\u30EB:" + names);
    return state;
};
exports.default = skill;
