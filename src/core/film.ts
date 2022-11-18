
export type FilmHolder = NoFilm | Film

export interface NoFilm {
  type: "none"
}

/**
 * でんこが着用するフィルム（ラッピング）
 */
export interface Film {
  type: "film"

  /**
   * フィルムのテーマ（シリーズ）
   * 
   * 異なるでんこのフィルムでも同じ値を持つことができます
   */
  theme: string

  /**
   * 与ダメ増減率 [%]
   * 
   * アクセス時のダメージ計算に使われます 
   * {@link AccessState attackPercent}
   */
  attackPercent?: number

  /**
   * 被ダメ増減率 [%]
   * 
   * アクセス時のダメージ計算に使われます 
   * {@link AccessState defendPercent}
   */
  defendPercent?: number

  /**
   * 獲得経験値の増減量 [%]
   * 
   * 増減する経験値の対象は、
   * - アクセスで獲得する経験値
   *   - アクセス開始時の付与
   *   - 与ダメ量に応じた経験値
   *   - リンク成功時の経験値
   * - （リブートなど）リンク解除時に獲得するリンク経験値
   * 
   * スキルによって付与される経験値量は対象外です
   */
  expPercent?: number

  /**
   * スキル処理で利用される値を増減させます
   */
  skill?: FilmSkillProperty
}

/**
 * フィルムのスキル補正
 * 
 * ## スキルのデータ
 * スキル処理で参照される値は基本的に保有するスキル・スキルのレベルに依存します
 * 詳細：{@link Skill property}
 * 
 * ## 補正の計算
 * このフィルム補正に定義したkeyと同じkeyの値で{@link ActiveSkill probability}
 * から読み出すとき補正値が影響します（フィルム補正に定義がないkeyで読み出す値は影響ありません）
 * 
 * - `readNumber`: 補正値を加算します
 * - `readNumberArray`: 配列の各要素に補正値を加算します
 * 
 * ## 利用例
 * （例）フィルムの定義
 * ```js
 * let film: Film = {
 *   type: "film",
 *   theme: "フィルムのテーマ名",
 *   skill: {
 *     atk: 15,
 *     probability: -10
 *   }
 * }
 * ```
 * 
 * このフィルムを着用した状態でスキルのデータを読み出すと、
 * - key:"atk" で読み出した値は+15
 * - key:"probability" で読み出した値は-10
 */
export interface FilmSkillProperty {
  [key: string]: number
}