"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var skill = {
    onAccessComplete: function (context, state, self, access) {
        var accessExp = self.exp.access; // 他スキルによる経験値は対象外
        var linkExp = self.exp.link;
        var exp = accessExp + linkExp; // 再配布の対象経験値
        if (exp > 0 && state.formation.length >= 2) {
            // 再配布対象が存在すること
            var idx_1 = (self.carIndex === 0) ? 1 : 0;
            var target = state.formation[idx_1];
            // 再配布できる場合
            if (target.currentExp < target.nextExp) {
                var evaluate = function (context, state, self) {
                    var percent = self.skill.property.readNumber("EXP");
                    var dst = state.formation[idx_1]; // 編成位置は変わらない前提
                    var value = Math.floor(exp * percent / 100);
                    context.log.log("\u7D4C\u9A13\u5024\u306E\u518D\u914D\u5E03 " + exp + " * " + percent + "% = " + value);
                    dst.currentExp += value; // アクセス中と異なる直接加算する
                    return state; // レベルアップの確認等の更新は呼び出し元で行う（はず）
                };
                return (0, __1.evaluateSkillAfterAccess)(context, state, self, true, evaluate);
            }
        }
        return state;
    }
};
exports.default = skill;
