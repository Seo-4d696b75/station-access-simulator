import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    // フットバースでも・相手不在でも発動する
    // before_accessで発動するため無効化の影響を受けない
    if (step === "before_access" && self.who === "offense") {
      // 無効化スキルの影響について
      // - 現行の仕様
      //   - てすと（cool属性の無効化）により無効化される（てすとの発動アイコン表示される）
      //   - しかし、なるのスキルも発動している（獲得スコアUP or 獲得スコアDown&ATK増加の両方の場合で確認）
      // - 実装
      //   - なる・てすとは共にbefore_accessでスキルが発動する
      //   - 同じ段階before_accessで発動するスキルは互いの無効化は干渉せず、すべて発動する
      //   - なるのスキル発動（ATK増加も含む）
      //   - てすとのスキル発動、なるを無効化
      //   - スキルを無効化しても既に発動したスキル効果は変化しない原則に則り、ATK増加はそのまま 
      // 他の獲得するスコアを増加させるタイプのスキルは無効化影響を受けるのでstart_accessで処理する
      // なぜ、なるだけ特別なのかは不明
      return {
        probability: "probability",
        recipe: (state) => {
          const scorePercent = self.skill.property.readNumber("score_percent")
          // アクセスで獲得するスコアを増加させる
          state.offense.scorePercent.access += scorePercent
          context.log.log(`集められる思い出がドカンとアップ！ ${formatPercent(scorePercent)}`)
        },
        fallbackRecipe: (state) => {
          const scorePercent = self.skill.property.readNumber("score_percent_failure")
          state.offense.scorePercent.access += scorePercent
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`たまに失敗するですが……${formatPercent(scorePercent)} ATK${formatPercent(atk)}`)
        }
      }
    }
  }
}

export default skill