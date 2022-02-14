"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var access_1 = require("../core/access");
var skill = {
    canEvaluate: function (context, state, step, self) {
        // リブートしていない、かつリンク保持継続している
        if (step === "after_damage" &&
            self.who === "defense" &&
            !self.reboot &&
            !state.linkDisconncted) {
            return self.skill.propertyReader("probability");
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        context.log.log("\u3042\u3089\u3001\u8AB0\u304B\u6765\u305F\u307F\u305F\u3044\u266A \u30AB\u30A6\u30F3\u30BF\u30FC\u653B\u6483");
        return (0, access_1.counterAttack)(context, state, self);
    }
};
exports.default = skill;
//# sourceMappingURL=D07_Sheena.js.map