import { ReadableProperty, WritableProperty } from "../property";

/**
 * 読み書き可能なデータモデル
 * 
 * ## サポートするデータ型  
 * - number
 * - string
 * - boolean
 * - number[]
 * - string[]
 * 
 * ## 初期化のタイミング
 * 以下のタイミングでデータは全て削除されます
 * - でんこ初期化などスキルを初期化したとき
 * - スキルの状態遷移が`idle`or`unable`から`active`に変化したとき
 */
export type SkillData = ReadableProperty & WritableProperty & {
  /**
   * すべての値を削除します
   */
  readonly clear: () => void
}