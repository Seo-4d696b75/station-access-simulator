import { getFormation } from "../core/access";
import { formatLinkTime } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessAfterDamage: (context, state, self) => {
    // カウンター被弾などアクセス側でも発動可能
    if (self.reboot) {
      // 一番長いリンク時間を選択
      // 被アクセスの場合はアクセスされた駅のリンクは対象外
      const linkIdx = minIndexBy(self.link, (s) => s.name === state.station.name ? null : s.start)
      if (linkIdx < 0) return
      // 移譲先のでんこ
      const dstIdx = self.carIndex === 0 ? 1 : 0
      const formation = getFormation(state, self.which)
      // 編成が単独なら移譲先なし
      if (dstIdx >= formation.length) return
      const dst = formation[dstIdx]
      // 自身より高レベルは対象外
      if (dst.level > self.level) return
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "skill_recipe",
        recipe: (state) => {
          // 書き込み可能な移譲先を再度取得
          const formation = getFormation(state, self.which)
          const src = formation[self.carIndex]
          const dst = formation[dstIdx]
          // 自身のリンクを削除してリブート処理対象から外す
          const link = src.link[linkIdx]
          src.link.splice(linkIdx, 1)
          // リンク時間（開始時間）はそのまま
          dst.link.push(link)
          context.log.log(`リンクの移譲`)
          context.log.log(`リンク：${link.name} ${formatLinkTime(context.currentTime, link)}`)
          context.log.log(`相手：${dst.firstName} (Lv.${dst.level})`)
        }
      }
    }
  },
}

export default skill

function minIndexBy<T>(list: readonly T[], mapper: (e: T) => number | null): number {
  var idx = -1
  var min = Number.MAX_VALUE
  for (var i = 0; i < list.length; i++) {
    const e = list[i]
    const value = mapper(e)
    if (typeof value === "number" && value < min) {
      min = value
      idx = i
    }
  }
  return idx
}