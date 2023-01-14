import { getBaseDamage, SkillLogic } from "..";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_special" && self.who === "defense" && self.currentHp > 1) {
      const base = getBaseDamage(context, state)
      const damage = base.variable + base.constant
      if (damage >= self.currentHp) {
        return {
          probability: "probability",
          recipe: (state) => {
            // 現在のHP - 1 にダメージ量を固定
            state.damageBase = {
              variable: 0,
              // このダメージ量は固定ダメージによって増えることはあっても減ることはない
              constant: self.currentHp - 1
            }
            // 固定ダメージの影響は受ける
            context.log.log(`ふぁぅ!!また転んじゃいましたぁ～痛いです～… BaseDamage:${self.currentHp - 1}`)
            /*
            いちほのスキル発動時の固定ダメージ増減の対応
            - 攻撃側の「軽減不能なダメージを与える」スキルは発動してダメージが加算される
            - 守備側同編成内の「ダメージを固定値で軽減する」スキルは発動するが、**その軽減値はダメージ値に反映されていない**  
              ref: <blockquote class="twitter-tweet"><p lang="ja" dir="ltr">そういやいちほのスキルとか固定ダメージスキルの発動タイミングってどこなん？<br><br>普通な被ダメ→致死ダメージの場合いちほ抽選→固定ダメージだと思ってたけど受ける側は違うんかな <a href="https://t.co/XfbJjwCsgZ">pic.twitter.com/XfbJjwCsgZ</a></p>&mdash; カス (@hyo_fffff) <a href="https://twitter.com/hyo_fffff/status/1200638284122058759?ref_src=twsrc%5Etfw">November 30, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
            
            が、どうも説明できないケースが見つかってしまった…
            <blockquote class="twitter-tweet"><p lang="ja" dir="ltr">固定ダメージスキルが増えましたからねえ🤔 何気ないアクセスでいちほが発動してもやられちゃいます <a href="https://t.co/vtLoFirXRD">pic.twitter.com/vtLoFirXRD</a></p>&mdash; カス (@hyo_fffff) <a href="https://twitter.com/hyo_fffff/status/1125641585239121920?ref_src=twsrc%5Etfw">May 7, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
            <blockquote class="twitter-tweet"><p lang="ja" dir="ltr">今更じゃが、固定ダメージあるとスキル発動しても1で耐えないのじゃな。。<br><br>耐えられないのは天才チコ様のスキルのみにして欲しかったのぅ<br>ゲーム的にも設定的にもの❗️<a href="https://twitter.com/hashtag/%E9%A7%85%E3%83%A1%E3%83%A2?src=hash&amp;ref_src=twsrc%5Etfw">#駅メモ</a> <a href="https://t.co/PlK9ltzXtI">pic.twitter.com/PlK9ltzXtI</a></p>&mdash; Fuka1922☕🦈 (@Fuka1922) <a href="https://twitter.com/Fuka1922/status/1246244825143193600?ref_src=twsrc%5Etfw">April 4, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
            いちほ発動しているからダメージは一旦215にセットされるはずだが、+2の説明ができない
            */
          },
        }
      }
    }
  }
}

export default skill