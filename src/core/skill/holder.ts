import { AccessDencoState } from "../access"
import { SimulatorError } from "../context"
import { MutableProperty, ReadableProperty } from "../property"
import { ReadonlyState } from "../state"
import { SkillLogic } from "./logic"
import { SkillTransition, SkillTransitionType } from "./transition"

export interface SkillState<T extends SkillTransitionType = SkillTransitionType> {

  // 状態遷移タイプに応じた判別のため便宜上追加
  transitionType: T

  // SkillHolderとして引数渡す場合に型推論が正しく行えるよう便宜的に追加
  type: "possess"

  /**
   * スキルレベル 1始まりの整数でカウントする
   */
  level: number
  /**
   * スキルの名称「*** Lv.1」など
   */
  name: string
  /**
   * スキルの状態遷移
   * 
   * **この状態を直接操作しないでください** {@link activateSkill} {@link deactivateSkill}などの関数を利用してください    
   * **Note** `always`など遷移タイプによってはスキル状態が不変な場合もある
   */
  transition: SkillTransition<T>

  // 参照する場所によってフィルム補正の有無が異なるので注意
  /**
   * スキルに関する各種データ（スキルプロパティ）にアクセスします
   * 
   * ### スキルプロパティの定義場所
   * 
   * `src/data/skill.json`で定義したデータを読み取ります. 
   * 読み取る値はスキルレベルに依存して変化する場合があります
   * 
   * ### サポートするデータ型  
   * - number
   * - string
   * - boolean
   * - number[]
   * - string[]
   * 
   * ### 利用例
   * (例)スキルデータ  
   * ```json
   * [
   *   {
   *     "numbering":"1",
   *     "key": "value2",
   *     "list": [
   *       {
   *         "skill_level": 1,
   *         "denco_level": 5,
   *         "key": "value1"
   *       },
   *       {
   *         "skill_level": 2,
   *         "denco_level": 15
   *       }
   *     ]
   *   }
   * ]
   * ```
   * 
   * 各関数`read**`を呼び出すと、
   * 
   * 1. 対応するスキルレベルのJSON Objectを調べて指定した`key`が存在すれば返す  
   *    （例）"skill_level": 1 の場合は "value1"
   * 2. スキルデータ直下のJSON Objectを調べて指定した`key`が存在すれば値を返す  
   *    （例）"skill_level": 2 の場合は "value2"
   * 3. デフォルト値`defaultValue`を返す
   * 
   * **例外の発生**  
   * - 1.2. において指定した`key`で見つかった値が予期した型と異なる場合
   * - 指定した`key`に対する値が存在せず、かつデフォルト値も指定が無い場合
   * 
   */
  property: ReadableProperty

  /**
   * スキルの処理に関わる任意のデータを保存できます
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
  data: ReadableProperty & MutableProperty
}

/**
 * でんこが保有するスキル
 */
export type Skill<T extends SkillTransitionType = SkillTransitionType> =
  T extends SkillTransitionType ? SkillState<T> & SkillLogic<T> & {
    /**
     * 
     * ## フィルム補正は反映されません！
     * ここから読み出す値には着用してるフィルムの補正値が反映されていません  
     * 
     * スキルの発動判定・発動時の処理を行うときは必ずコールバックに渡される{@link ActiveSkill}から参照してください
     */
    property: ReadableProperty
  } : never

interface SkillNotAcquired {
  type: "not_acquired"
}

interface SkillNone {
  type: "none"
}

/**
 * スキルの保有をモデル化します
 * 
 * `type`の値に応じて３種類のスキル保有状態があります
 * - "possess" : スキルを保有している
 * - "not_acquired" : でんこのレベルが低くまだスキルを保有していない
 * - "none" : スキルを保有していない
 */
export type SkillHolder = Skill | SkillNotAcquired | SkillNone

/**
 * でんこが保持しているスキルを取得します
 * @param denco 
 * @returns 保持しているスキル
 * @throws スキルを保持していない場合
 */
export function getSkill<S extends SkillState | ReadonlyState<SkillState>>(denco: { skill: S | SkillNotAcquired | SkillNone }): S {
  if (denco.skill.type === "possess") {
    return denco.skill
  }
  throw new SimulatorError("skill not found")
}

/**
* スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
* @param skill 
* @returns 
*/
export function isSkillActive<S extends SkillState | ReadonlyState<SkillState>>(skill: S | SkillNotAcquired | SkillNone): skill is S {
  return skill.type === "possess" && skill.transition.state === "active"
}

/**
 * アクセス開始時においてスキル無効化の対象となるか判定する
 * 
 * 以下の条件を全て満たす場合のみ`true`  
 * - スキルを保有している
 * - スキル状態が`active`である
 * - まだ無効化の影響を受けていない
 * - アクセス時に影響を受けるスキルである  
 *   「アクセス時に影響を受けないスキルに関しては無効化されません」と説明されており、実装では
 *   アクセス処理のコールバック `triggerOnAccess, onAccessComplete`のいずれも未定義の場合と判断する
 * 
 * @param state アクセス処理中の状態 
 * @returns 
 */
export function canSkillInvalidated<S extends ReadonlyState<AccessDencoState>>(state: S): boolean {
  const skill = state.skill
  return skill.type === "possess"
    && skill.transition.state === "active"
    && !state.skillInvalidated
    && (!!skill.triggerOnAccess || !!skill.onAccessComplete)
}