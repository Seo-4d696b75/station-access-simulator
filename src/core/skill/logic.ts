import { AccessDencoResult, AccessDencoState, AccessResult, AccessSkillStep, AccessSkillTriggers, AccessState, AccessUserResult } from "../access"
import { Context } from "../context"
import { DencoState } from "../denco"
import { EventSkillTrigger, SkillEventDencoState, SkillEventState } from "../event"
import { ReadonlyState } from "../state"
import { LinksResult, StationLinkStart } from "../station"
import { UserState } from "../user"
import { Skill, SkillState } from "./holder"
import { SkillProperty } from "./property"
import { SkillDeactivateStrategy, SkillTransitionType } from "./transition"
import { SkillTriggerCallbacks } from "./trigger"

/**
* スキルの発動確率を百分率で表現
* 
* 乱数計算の詳細はRandomを参照
* 
* - 0以下の場合は必ず発動しません
* - 100以上はの場合は必ず発動します
*/
export type ProbabilityPercent = number

// DencoStateからskillを一旦取り除かないとskill.propertyのdocs参照がごっちゃになる
export type WithSkill<T extends DencoState> = Omit<T, "skill"> & {
  /**
   * 主体となるでんこの編成内のindex  
   * 0 <= carIndex < formation.length
   */
  carIndex: number

  // skill: SkillHolder だと skill.type === "possess" のチェックが必要で煩雑なのを省略する
  skill: SkillState & {
    // SkillLogic自身を参照することは基本ないのでSkillStateのみ

    /**
     * このスキルがactiveかどうか
     * 
     * `transition.state === "active"`と同値です
     */
    active: boolean

    /**
     * 
     * ### 着用中のフィルム補正が影響します！
     * 
     * 関数`readNumber, readNumberArray`が読み出す値には上記に加え、
     * 着用中のフィルムの補正値が加算されます.
     * 
     * フィルムの補正値は{@link Film skill}を参照します.
     */
    property: SkillProperty
  }
}

/**
 * スキルレベルに依存しないスキルの発動等に関わるロジックを各種コールバック関数として定義します
 * 
 * ## スキルレベルに依存するデータ
 * スキルレベルに依存するデータは各コールバック関数の引数に渡される{@link Skill property}オブジェクトから参照できます  
 * （例）引数`self: ActiveSkill`に対して`self.skill.property`からアクセスできる
 * 
 */
export type SkillLogic<T extends SkillTransitionType = SkillTransitionType> =
  T extends "manual" ? ManualSkillLogic :
  T extends "manual-condition" ? ManualConditionSkillLogic :
  T extends "auto" ? AutoSkillLogic :
  T extends "auto-condition" ? AutoConditionSkillLogic :
  T extends "always" ? AlwaysSkillLogic : never

type ManualSkillLogic =
  DeactivatableSkillLogic<"manual">
  & SkillCooldownCallback

type ManualConditionSkillLogic =
  DeactivatableSkillLogic<"manual-condition">
  & SkillUnableCallback
  & SkillCooldownCallback
  & {
    /**
     * スキル状態の遷移タイプ`manual-condition`において`idle <> unable`状態であるか判定する
     * 
     * @returns trueの場合は`idle`状態へ遷移
     */
    canEnabled: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<WithSkill<DencoState>>) => boolean
  }

type AutoSkillLogic =
  DeactivatableSkillLogic<"auto">
  & SkillUnableCallback
  & SkillCooldownCallback

type AutoConditionSkillLogic = ActivatableSkillLogic<"auto-condition"> & SkillUnableCallback & {
  /**
   * スキル状態の遷移タイプ`auto-condition`において`active`状態であるか判定する
   * 
    * @returns trueの場合は`active`状態へ遷移
   */
  canActivated: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<WithSkill<DencoState>>) => boolean
}

type AlwaysSkillLogic = BaseSkillLogic<"always">

// スキル状態`cooldown`に遷移可能なタイプのみ
interface DeactivatableSkillLogic<T extends "manual" | "manual-condition" | "auto"> extends ActivatableSkillLogic<T> {
  /**
   * スキル状態遷移のタイプ`manual,manual-condition,auto`において
   * アクティブな状態`active`を終了して`cooldown, idle(unable)`へ移行する方法を指定します
   * 
   * `idle/unable -> active`に状態遷移したタイミングで参照されます.  
   * 
   * ### Strategyの種類
   * 状態遷移の処理方法が変わります
   * 
   * - `"default_timeout"`: スキルプロパティから`active,cooldown`状態の時間をそれぞれ読み出します
   *   - 読み出した時間が経過したら自動で`active => cooldown => idle(unable)`に状態遷移します
   * - `"self_deactivate"`: スキル自身がスキルを無効化するタイミングを制御します  
   *   - 関数`deactivateSkill`を必要なタイミングで呼び出す必要があります
   *   - `cooldown`状態の時間はスキルプロパティから読み出します
   *     - `deactivateSkill`の呼び出しでスキル状態が`active => cooldown`に遷移したタイミングで読み出します
   *     - 読み出した時間が経過したら自動で`cooldown => idle(unable)`に状態遷移します
   * 
   * ### スキルプロパティからの時間の読み出し
   * 各keyを指定して関数{@link SkillProperty readNumber}からsec単位で読み出します
   * - `active`有効状態の時間："active"
   * - `cooldown`クールダウン状態の時間："cooldown"
   *  
   * keyがスキルプロパティに未定義、もしくはデータがnumber型以外の場合は例外を投げます
   * 
   * ### フィルム補正
   * スキルプロパティから読み出す時間の値にはフィルム補正が影響します
   * 
   * スキルを保有するでんこが着用中のフィルムに{@link Film skillActiveDuration skillCooldownDuration}
   * が定義されている場合、スキルプロパティから読み出した各値"active", "cooldown"に補正値が加算されます
   */
  deactivate: SkillDeactivateStrategy

}

// スキル状態が`active`に遷移可能なタイプのみ（always以外）
interface ActivatableSkillLogic<T extends "manual" | "manual-condition" | "auto" | "auto-condition"> extends BaseSkillLogic<T> {

  /**
   * スキル状態が`active`へ変更された直後の処理をここで行う
   * 
   * スキル状態遷移のタイプ`manual,manual-condition,auto,auto-condition`限定  
   * 
   * @param self **Readonly** このスキルを保持するでんこ自身の現在の状態 スキルの状態は`active`です（`self.skill.active === true`）
   * @return 状態を更新する場合は新しい状態を返します
   */
  onActivated?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<WithSkill<DencoState>>) => void | UserState

}

interface SkillUnableCallback {

  /**
   * スキル状態が`unable`へ変更された直後の処理をここで行う
   * 
   * スキル状態遷移のタイプ`manual-condition,auto,auto-condition`限定  
   * 
   * @param self **Readonly** このスキルを保持するでんこ自身の現在の状態 スキルの状態は`unable`です（`self.skill.active === false`）
   * @return 状態を更新する場合は新しい状態を返します
   */
  onUnable?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<WithSkill<DencoState>>) => void | UserState
}

interface SkillCooldownCallback {

  /**
   * スキル状態が`cooldown`へ変更された直後の処理をここで行う
   * 
   * スキル状態遷移のタイプ`manual,manual-condition,auto`限定  
   * 
   * @param self **Readonly** このスキルを保持するでんこ自身の現在の状態 スキルの状態は`cooldown`です（`self.skill.active === false`）
   * @return 状態を更新する場合は新しい状態を返します
   */
  onCooldown?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<WithSkill<DencoState>>) => void | UserState
}

// スキル状態遷移のタイプに依存しない、共通のコールバック定義
interface BaseSkillLogic<T extends SkillTransitionType> extends SkillTriggerCallbacks {

  /**
   * スキル状態遷移のタイプを指定します
   * 
   * 遷移タイプに応じて定義する必要のあるプロパティ、定義できるコールバックの種類が変わります
   * 
   * {@link SkillTransitionType}
   */
  transitionType: T

  /**
   * アクセス時の各段階においてスキル発動の判定とスキル発動処理を定義します
   * 
   * ### アクセス処理でコールバックされる条件
   * - このスキルの状態が`active`である
   * - 他の無効化スキルの影響を受けていない
   * 
   * @param context 同一のアクセス処理中は同一のオブジェクトが使用されます
   * @param state アクセス全般の状態  
   * **Readonly** この関数呼び出しの段階ではスキル発動が確定していないため状態は更新できません. スキルを発動の判定・状態の更新方法は関数の返り値で指定できます.
   * @param step アクセス中の段階 １回のアクセス処理で各段階は決められた順序で最大１回のみ呼び出されます（場合によっては呼び出されない段階もあります）
   * @param self このスキルを保持するでんこ自身 HPやATKなどのでんこの基本状態に加え、スキルのレベルや効果量などスキルの状態も参照できます.  
   * **Readonly** このスキルが発動する直前の状態をキャプチャしています
   * 
   * @return スキル発動の判定方法・発動時の処理を返り値で指定できます  
   * - void: スキルは発動しません. 確率計算に依存せず発動しないことが明白な場合に適切です.
   * - AccessSkillTriggers: 指定された`probabilityKey`で発動確率[%]をスキルプロパティから読み出して
   * スキル発動有無を判定し、発動する場合は`recipe`で状態を更新します 
   * 
   */
  triggerOnAccess?: (context: Context, state: ReadonlyState<AccessState>, step: AccessSkillStep, self: ReadonlyState<WithSkill<AccessDencoState>>) => void | AccessSkillTriggers


  /**
   * アクセス時以外のスキル評価において付随的に発動するスキルの発動判定と処理を定義します
   * 
   * **注意** 現状ではひいるの確率補正のみ
   * 
   * ### イベント処理でコールバックされる条件
   * - このスキルの状態が`active`である
   * - 他の無効化スキルの影響を受けていない（直前のアクセス処理の影響を受ける場合のみ）
   * 
   * @param context 同一のイベント処理中は同一のオブジェクトが使用されます
   * @param state スキル発動型のイベント全般の状態  
   * **Readonly** この関数呼び出しの段階ではスキル発動が確定していないため状態は更新できません. スキルを発動の判定・状態の更新方法は関数の返り値で指定できます.
   * @param self このスキルを保持するでんこ自身 HPやATKなどのでんこの基本状態に加え、スキルのレベルや効果量などスキルの状態も参照できます.  
   * **Readonly** このスキルが発動する直前の状態をキャプチャしています
   * 
   * @return スキル発動の判定方法・発動時の処理を返り値で指定できます  
   * - void: スキルは発動しません. 確率計算に依存せず発動しないことが明白な場合に適切です.
   * - EventSkillTrigger: 指定された確率`probability`でスキル発動有無を判定し、発動する場合は`recipe`で状態を更新します
   * 
   */
  triggerOnEvent?: (context: Context, state: ReadonlyState<SkillEventState>, self: ReadonlyState<WithSkill<SkillEventDencoState>>) => void | EventSkillTrigger

  /**
   * アクセス処理が完了した直後に呼ばれます
   * 
   * - **直前のアクセス処理で無効化スキルの影響を受けている場合があります**  
   *   他のスキルにより無効化されていてもこの関数は呼ばれます
   * - **スキル状態に関わらずコールバックされます**  
   *   現在のスキル状態が`active`かどうかは`self.skill.active`を参照してください
   * 
   * ### アクセス直後のスキル発動
   * このコールバックで処理します.
   * 関数`triggerSkillAfterAccess`を利用して更新した新しい状態をこの関数から返します
   * 
   * 
   * ### コールバックの順序
   * アクセス処理後に呼ばれる可能性のあるコールバックと呼び出す順序
   * 
   * 1. {@link onDencoReboot} 自身がリブートした場合
   * 2. {@link onLinkDisconnected} 編成内の誰かのリンクが解除された場合
   * 3. {@link onLinkStarted} 編成内の誰かがリンクを開始
   * 4. `onAccessComplete` このコールバック
   * 
   * @param context
   * @param state **Readonly** 現在の状態
   * @param self **Readonly** 直前のアクセスの結果を反映しています. スキルのレベルや効果量などスキルの状態も参照できます.
   * @param access **Readonly** 直前のアクセスの状態 
   * @returns 状態を更新する場合は新しい状態を返します
   */
  onAccessComplete?: (context: Context, state: ReadonlyState<AccessUserResult>, self: ReadonlyState<WithSkill<AccessDencoResult>>, access: ReadonlyState<AccessResult>) => void | AccessUserResult

  /**
   * スキルを保持するでんこがリブートした直後に呼ばれます
   * 
   * - アクセス処理でダメージを受けてリブート
   * - アクセス中以外のスキルの効果でリブート（未実装）
   * 
   * **スキル状態に関わらずコールバックされます** 現在のスキル状態が`active`かどうかは`self.skill.active`を参照してください
   * 
   * ### コールバックの順序
   * アクセス処理後に呼ばれる可能性のあるコールバックと呼び出す順序
   * 
   * 1. `onDencoReboot` このコールバック
   * 2. {@link onLinkDisconnected} 編成内の誰かのリンクが解除された場合
   * 3. {@link onLinkStarted} 編成内の誰かがリンクを開始
   * 4. {@link onAccessComplete} アクセス処理の完了後
   * 
   * @returns 状態を更新する場合は新しい状態を返します
   */
  onDencoReboot?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<WithSkill<DencoState>>) => void | UserState

  /**
   * 編成内のでんこのリンクが解除されたとき呼ばれます
   * 
   * このスキルを保持するでんこ自身だけでなく、編成内のでんこ全員が対象です
   * 
   * - アクセス処理でダメージを受けてリブートし、保持していたリンクすべてが解除された
   * - フットバースによりリブートせず単独リンクが解除された
   * - アクセス中以外のスキルの効果でリブート（未実装）
   * 
   * **１つ以上のリンクが解除された場合のみ呼ばれます**  
   * リンク保持なしでカウンター攻撃を受けリブートした場合は解除されるリンクは無いのコールバックされません
   * 
   * **スキル状態に関わらずコールバックされます**  
   * 現在のスキル状態が`active`かどうかは`self.skill.active`を参照してください
   * 
   * 
   * ### コールバックの順序
   * アクセス処理後に呼ばれる可能性のあるコールバックと呼び出す順序
   * 
   * 1. {@link onDencoReboot} 自身がリブートした場合
   * 2. `onLinkDisconnected` このコールバック
   * 3. {@link onLinkStarted} 編成内の誰かがリンクを開始
   * 4. {@link onAccessComplete} アクセス処理の完了後
   * 
   * @param disconnect 解除されたリンク・リンクを保持していたでんこの情報 {@link LinksResult link}の長さは必ず１以上です
   * @returns 状態を更新する場合は新しい状態を返します
   */
  onLinkDisconnected?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<WithSkill<DencoState>>, disconnect: ReadonlyState<LinksResult>) => void | UserState

  /**
   * 編成内のでんこが新たにリンクを開始したとき呼ばれます
   * 
   * このスキルを保持するでんこ自身だけでなく、編成内のでんこ全員が対象です. 
   * 原則としてアクセスによりリンク成功したタイミングです
   * 
   * 
   * **スキル状態に関わらずコールバックされます**  
   * 現在のスキル状態が`active`かどうかは`self.skill.active`を参照してください
   * 
   * ### コールバックの順序
   * アクセス処理後に呼ばれる可能性のあるコールバックと呼び出す順序
   * 
   * 1. {@link onDencoReboot} 自身がリブートした場合
   * 2. {@link onLinkDisconnected} 編成内の誰かのリンクが解除された場合
   * 3. `onLinkStarted` このコールバック
   * 4. {@link onAccessComplete} アクセス処理の完了後
   * 
   * @param link 新たに開始したリンク
   * @returns 状態を更新する場合は新しい状態を返します
   */
  onLinkStarted?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<WithSkill<DencoState>>, link: ReadonlyState<StationLinkStart>) => void | UserState

  /**
   * １時間の時間経過ごとに呼ばれます
   * 
   * （例）もえのスキル発動処理
   * 
   * ### スケジュールの時刻
   * 毎時00:00.000にコールバックのタイミングがスケジュールされます  
   * 
   * 各ユーザの初期化タイミングによってスケジュールされる時刻がユーザ間で異なる可能性があります
   * 
   * ### コールバックのタイミング
   * スケジュールされただけではこの関数は呼ばれません.  
   * 関数`refreshState`でユーザ状態を更新するとき、
   * 現在時刻がスケジュールされた時刻を過ぎていると実際にコールバックされます.  
   * つまりスケジュールされた時刻以降で最初に`refreshState`が呼ばれたタイミングでこの関数が呼ばれます.
   */
  onHourCycle?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<WithSkill<DencoState>>) => void | UserState

  // TODO コールバックの実装
  // onFormationChanged?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
  // onDencoHPChanged?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
  // onLinkSuccess?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
}