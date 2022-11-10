import { MutableProperty, ReadableProperty } from "../property";

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
 * 
 * ## 読み込み専用な型
 * `ReadonlyState<SkillData>`の場合では書き込み関数`put**`は参照できません  
 * 一旦コピーして変更可能なオブジェクトを取得してから書き込みます
 * ```
 * const state: ReadonlyState<UserState>
 * let d1 = getSkill(state.formation[0]).data // ReadonlyState<SkillData>
 * d1.putString("key", 0) // Error
 * 
 * const next = copyState<UserState>(state)
 * let d2 = getSkill(next.formation[0]).data // SkillData
 * d2.putString("key", 0) // OK
 * ```
 */
export type SkillData = ReadableProperty & MutableProperty