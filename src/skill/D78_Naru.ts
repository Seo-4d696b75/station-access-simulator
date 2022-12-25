import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  triggerOnAccess: (context, state, step, self) => {
    // フットバースでも・相手不在でも発動する
    // before_accessで発動するため無効化の影響を受けない
    if(step === "before_access" && self.who === "offense") {
      // TODO 要確認
      // エリアの無効化対象になるか？
      // スコア増加失敗時のATK増加は「ダメージを増加させるスキル」に該当するので対象になるのが自然
      // ただし、現状の実装では無効化の前段階 before_accessでATK増加も処理しているため、
      // エリアのスキルが発動してなるを無効化してもATKの増加はそのまま
      return {
        probabilityKey: "probability",
        recipe: (state) => {

        },
        fallbackRecipe: (state) => {
          const atk = self.skill.property.readNumber("ATK")
          state.attackPercent += atk
          context.log.log(`たまに失敗するですが……ATK${formatPercent(atk)}`)
        }
      }
    }
  }
}

export default skill