"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "damage_special" && self.who === "offense") {
            return self.skill.property.readNumber("probability");
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        // 相手のHPと同じダメージ量に固定
        var hp = (0, __1.getAccessDenco)(state, "defense").currentHp;
        state.damageBase = {
            variable: 0,
            // 固定ダメージの他スキルでもこのダメージは軽減は不可
            constant: hp,
        };
        // ただし、いちほなど他スキルによって上書きされる場合もある
        /* 固定ダメージ増減の順序について
        チコのスキルが発動した場合、固定ダメージ増減のスキルを持つ他でんこは、
        事実１：攻撃側編成内の「軽減不能なダメージを与える」スキル（同じくcoolタイプのつづき、マコ）は発動する
           ref: <blockquote class="twitter-tweet"><p lang="ja" dir="ltr">チコスキルの処理は割と特殊なことをしてるのがわかる一枚。属性の計算が終わった後に固定ダメージの計算（自分の固定ダメージ－相手の固定軽減）なんですが、チコスキル発動にかかわらずこちらのつづきが乗っているのを見る限り、属性計算→固定軽減→「チコスキル」→固定ダメージ の順のようで。 <a href="https://t.co/iH2FILGrCs">pic.twitter.com/iH2FILGrCs</a></p>&mdash; キリ@駅メモ (@kiri_memories) <a href="https://twitter.com/kiri_memories/status/1087641796962770945?ref_src=twsrc%5Etfw">January 22, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
        事実２：守備側編成内の「ダメージを固定値で軽減する」スキルは発動するが、**その軽減値はダメージ値に反映されていない**
           ref: スクショ参照
        推測１：守備側編成内の「ダメージを固定値で軽減する」スキルが発動してチコのスキルによるダメージ値を軽減することはない
           [wiki 駅メモ - 作草部チコ](https://ek1mem0.wiki.fc2.com/wiki/%E4%BD%9C%E8%8D%89%E9%83%A8%E3%83%81%E3%82%B3)
           > チコのスキルが発動した場合、相手の編成内のDEF増加/軽減スキルは発動しても、固定値軽減のでんこ（属性EX3体やまぜなど）のアイコンは出ない。
           ただ、事実１の通り発動してアイコンは出るがダメージ値には反映されていない
           記述のミスかアップデートによる挙動変更？
        推測２：固定ダメージ計算は増加・減少で分離して処理すると辻褄が合う
          1. ダメージを固定値で軽減する
          2. 特殊なダメージ計算（チコのスキル）
          3. 軽減不能なダメージを与える
        事実３：固定ダメージ増減の計算は特殊計算（チコのスキルの後）で行われる旨の公式記述がある
          [駅メモのスキルの発動順序について](https://blog.ekimemo.com/post/179166914454/%E9%A7%85%E3%83%A1%E3%83%A2%E3%81%AE%E3%82%B9%E3%82%AD%E3%83%AB%E3%81%AE%E7%99%BA%E5%8B%95%E9%A0%86%E5%BA%8F%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6)
          > ここは、ダメージ計算①で計算されたダメージに軽減不能なダメージを追加したり、固定値の軽減をするスキルが発動するフェーズです。
          該当記事が記述された時点でチコは実装済みで当然考慮されていると思われる
          > アクセスする側の特殊な計算をする代表的なスキルにはチコのような「相手のHPを0にする」ものがあり
          とチコは特殊なダメージ計算に分類されると明言されている
          しかし、チコのスキル発動時の挙動は事実１と２を見る通り明らかに矛盾する
        推測３：公式の記述は分かりやすさを優先しており実際の実装通りとは限らない
          多くの場合で推測２で分離した固定ダメージ増加・減少の順序は入れ替えられる
          そのため
          > 軽減不能なダメージ - 固定値で軽減するダメージ
          とまとめて説明しても大枠で間違っていない
          そもそも該当記事は「他スキルを無効化するスキル」が登場してスキルの発動有無に関する混乱が広がったときに
          公式が対応するように急遽発表したものであり、スキルの実装を詳細に説明するよりは
          概要を分かりやすく伝えることが目的だと考えられる
          一部の説明が厳密には実装と乖離していても不思議ではない
        推測４：固定ダメージ増減でも軽減不可なダメージ量を定義する
          ダメージ計算が複雑になるが固定ダメージ計算の増加・減少を分離する必要はない
          ただし攻撃側・守備側の固定ダメージスキルがかち合った場合の挙動がやや怪しい
        */
        context.log.log("\u30C1\u30B3\u304C\u3044\u308C\u3070\u697D\u52DD\u3088\uFF01\u30C1\u30B3\u306F\u8D85\u5929\u624D\u3067\u3093\u3053\u306A\u3093\u3060\u304B\u3089\uFF01\uFF01 BaseDamage:" + hp);
        return state;
    },
    disactivateAt: function (context, state, self) {
        var now = (0, __1.getCurrentTime)(context);
        var active = self.skill.property.readNumber("active");
        var wait = self.skill.property.readNumber("wait");
        return {
            activeTimeout: now + active * 1000,
            cooldownTimeout: now + (active + wait) * 1000,
        };
    }
};
exports.default = skill;
