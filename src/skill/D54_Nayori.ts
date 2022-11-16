import { triggerSkillAfterAccess } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  onAccessComplete: (context, state, self, access) => {
    // 配布対象はアクセスによる経験値・リブートによるリンク経験値
    if (self.who === "offense" || self.reboot) {
      // アクセスの経験値（アクセス開始時・リンク成功・与ダメージ量相応）
      // スキルによる経験値配布は対象外
      // リブートしたリンクの経験値
      const exp = self.exp.access + self.exp.link
      // 配布対象の数
      const dstIndices = self.skill.property
        .readNumberArray("exp_index")
        .filter(idx => idx < state.formation.length)
      const dstCnt = dstIndices
        .map(idx => state.formation[idx])
        .filter(d => d.numbering !== self.numbering) // 自身は対象外
        .filter(d => d.currentExp < d.nextExp) // レベルアップの余地があるか
        .length
      if (exp > 0 && dstCnt > 0) {
        // 配布する経験値がある && 配布対象がいる
        return triggerSkillAfterAccess(
          context,
          state,
          self,
          (state) => {
            const percent = self.skill.property.readNumber("exp_percent")
            const dstExp = Math.floor(exp * percent / 100)
            context.log.log(`経験値をみんなに届けるなの exp:${exp} (access:${self.exp.access}, link:${self.exp.link})`)
            dstIndices
              .map(idx => state.formation[idx])
              .filter(d => d.numbering !== self.numbering)
              .forEach(d => {
                context.log.log(`経験値の配布 ${d.name} exp:${d.currentExp} => ${d.currentExp + dstExp})`)
                d.currentExp += dstExp
              })
          }
        )
      }
    }
  }
}

export default skill