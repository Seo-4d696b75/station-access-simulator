"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var skill = {
    canEnabled: function (context, state, self) {
        // 自身がcnt数以上のリンクを保持している
        var cnt = self.skill.propertyReader("links");
        return self.link.length >= cnt && state.formation.length > 1;
    },
    disactivateAt: function (context, state, self) {
        var active = self.skill.propertyReader("active");
        var wait = self.skill.propertyReader("wait");
        var now = (0, __1.getCurrentTime)(context);
        return {
            activeTimeout: now + active * 1000,
            cooldownTimeout: now + (active + wait) * 1000,
        };
    },
    onActivated: function (context, state, self) {
        // スキルが有効化した瞬間にスキル発動
        return (0, __1.evaluateSkillAtEvent)(context, state, self, true, evaluate);
    }
};
// スキル発動時の処理内容
var evaluate = function (context, state, self) {
    var links = self.link;
    var stataions = links.map(function (link) { return link.name; }).join(",");
    if (links.length <= 1)
        context.log.error("リンク数>1が必要です");
    var idx = Math.floor(links.length * context.random());
    var link = links[idx];
    // 移譲するリンクは開始時刻そのまま いろは本人には経験値入らない
    state.formation[self.carIndex].link.splice(idx, 1);
    // 移譲先の決定
    if (state.formation.length <= 1)
        context.log.error("リンクの移譲先が見つかりません");
    if (self.carIndex === 0) {
        idx = 1;
    }
    else {
        idx = 0;
    }
    // リンクの移譲
    state.formation[idx].link.push(link);
    context.log.log("\u6E21\u3057\u305F\u3044\u99C5\u3092\u6E21\u305B\u306A\u304F\u3066\u3069\uFF5E\u3057\u3088\uFF5E\uFF01\uFF01 \u30EA\u30F3\u30AF:" + stataions + " \u79FB\u8B72\u3059\u308B\u30EA\u30F3\u30AF:" + JSON.stringify(link) + " \u79FB\u8B72\u76F8\u624B:" + state.formation[idx].name);
    return state;
};
exports.default = skill;
//# sourceMappingURL=D10_Iroha.js.map