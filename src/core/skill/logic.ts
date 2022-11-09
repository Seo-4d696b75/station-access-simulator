import { AccessDencoResult, AccessDencoState, AccessEvaluateStep, AccessResult, AccessSkillTriggers, AccessState, AccessUserResult } from "../access"
import { Context } from "../context"
import { DencoState } from "../denco"
import { EventSkillTrigger, SkillEventDencoState, SkillEventState } from "../event"
import { ReadonlyState } from "../state"
import { UserState } from "../user"
import { Skill } from "./holder"
import { SkillActiveTimeout, SkillCooldownTimeout } from "./transition"

/**
* スキルの発動確率を百分率で表現
* 
* 乱数計算の詳細はRandomを参照
* 
* - 0以下の場合は必ず発動しません
* - 100以上はの場合は必ず発動します
*/
export type ProbabilityPercent = number

/**
 * スキルの発動を評価するときに必要な情報へのアクセス方法を定義
 */
export interface ActiveSkill {
  /**
   * 主体となるでんこの編成内のindex  
   * 0 <= carIndex < formation.length
   */
  carIndex: number

  // skill: SkillHolder だと skill.type === "possess" のチェックが必要で煩雑なのを省略する
  skill: Skill
}

/**
 * スキルレベルに依存しないスキルの発動等に関わるロジックを各種コールバック関数として定義します
 * 
 * すべてのコールバックは対象のタイミングにおいて**スキル自身がactiveな場合のみ**呼ばれます
 * 
 * ## スキルレベルに依存するデータ
 * スキルレベルに依存するデータは各コールバック関数の引数に渡される{@link Skill property}オブジェクトから参照できます  
 * （例）引数`self: ActiveSkill`に対して`self.skill.property`からアクセスできる
 * 
 */
export interface SkillLogic {
  /**
   * アクセス時の各段階においてスキル発動の判定とスキル発動処理を定義します
   * 
   * 他の無効化スキルの影響を受けている場合は呼ばれません
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
   * - AccessSkillTrigger: 指定された確率`probability`でスキル発動有無を判定し、発動する場合は`recipe`で状態を更新します
   * 
   */
  evaluate?: (context: Context, state: ReadonlyState<AccessState>, step: AccessEvaluateStep, self: ReadonlyState<AccessDencoState & ActiveSkill>) => void | AccessSkillTriggers


  /**
   * アクセス時以外のスキル評価において付随的に発動するスキルの発動判定と処理を定義します
   * 
   * **注意** 現状ではひいるの確率補正のみ
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
  evaluateOnEvent?: (context: Context, state: ReadonlyState<SkillEventState>, self: ReadonlyState<SkillEventDencoState & ActiveSkill>) => void | EventSkillTrigger

  /**
   * アクセス処理が完了した直後に呼ばれます
   * 
   * **直前のアクセス処理で無効化スキルの影響を受けている場合があります**
   * 他のスキルにより無効化されていてもこの関数は呼ばれます（単にactive状態なら呼ばれます）
   * 
   * ### アクセス直後のスキル発動
   * このコールバックで処理します.
   * 関数`evaluateSkillAfterAccess`を利用して更新した新しい状態をこの関数から返します
   * 
   * ### 他コールバックの順序
   * アクセス処理が終了すると、
   * - `onDencoReboot` : このスキルを保持するでんこがリブートした場合のみ
   * - `onAccessComplete` : この関数
   * 
   * @param context
   * @param state **Readonly** 現在の状態
   * @param self **Readonly** 直前のアクセスの結果を反映しています. スキルのレベルや効果量などスキルの状態も参照できます.
   * @param access **Readonly** 直前のアクセスの状態 
   * @returns 状態を更新する場合は新しい状態を返します
   */
  onAccessComplete?: (context: Context, state: ReadonlyState<AccessUserResult>, self: ReadonlyState<AccessDencoResult & ActiveSkill>, access: ReadonlyState<AccessResult>) => void | AccessUserResult

  /**
   * スキルを保持するでんこがリブートした直後に呼ばれます
   * 
   * ### アクセス処理中にダメージが発生して場合
   * 
   *   - 非アクセスでダメージを受ける
   *   - スキルでカウンターを受ける　（例）シーナ・くに
   *   - スキルでダメージが発生する （例）まりか
   * 
   * アクセスによる影響（HPの変化・経験値の追加・レベルアップなど）を反映した状態が引数に渡されます
   * 
   * ### スキルの影響
   * 未実装
   */
  onDencoReboot?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
  
  /**
   * フットバースでも発動するスキルの場合はtrueを指定  
   * 一部のスキル発動ステップはフットバース時はスキップされる
   */
  evaluateInPink?: boolean

  /**
   * スキル状態遷移のタイプ`manual,manual-condition,auto`においてアクティブな状態`active`が終了して`cooldown`へ移行する判定の方法を指定する
   * 
   * `idle/unable -> active`に状態遷移したタイミングで呼ばれ、返値によって`cooldown`への遷移の基準が変わる  
   * - undefined: スキル側で適宜状態を変更する
   * - `SkillActiveTimeout`: 指定した時間経過したら状態を変更する
   * 
   * `deactivateAt`を指定しない場合は返値`undefined`と同様に処理する
   * @returns 一定時間の経過で判定する場合はtimeoutを返す
   */
  deactivateAt?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => undefined | Omit<SkillActiveTimeout, "activatedAt">

  /**
   * スキル状態遷移のタイプ`manual,manual-condition,auto`において`cooldown`が終了して`idle/unable`へ移行する判定の方法を指定する
   * 
   * `deactivateSkill`で`active > cooldown`に状態変化したタイミングで呼ばれる  
   * ただし、`deactivateAt`で`SkillActiveTimeout`を返した場合はその設定に従うので`completeCooldownAt`は呼ばれない
   * 
   * @returns 返値で指定した時刻以降に`cooldown > unable/idle`へ移行する
   */
  completeCooldownAt?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => SkillCooldownTimeout

  /**
   * スキル状態の遷移タイプ`auto-condition`において`active`状態であるか判定する
   * 
   * `auto-condition`タイプでこの関数未定義はエラーとなる
   * @returns trueの場合は`active`状態へ遷移
   */
  canActivated?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => boolean

  /**
   * スキル状態の遷移タイプ`manual-condition`において`idle <> unable`状態であるか判定する
   * 
   * `manual-condition`タイプでこの関数未定義はエラーとなる
   * @returns trueの場合は`idle`状態へ遷移
   */
  canEnabled?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => boolean

  /**
   * スキル状態が`active`へ変更された直後の処理をここで行う
   * 
   * スキル状態遷移のタイプ`manual,manual-condition,auto,auto-condition`限定
   */
  onActivated?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState

  /**
   * １時間の時間経過ごとに呼ばれます
   * 
   * （例）もえのスキル発動処理
   * 
   * ### スケジュールの時刻
   * 関数`initUser`でユーザ状態を初期化した時刻から起算してぴったり1時間ごとに
   * コールバックのタイミングがスケジュールされます  
   * 
   * 各ユーザの初期化タイミングによってスケジュールされる時刻がユーザ間で異なる可能性があります
   * 
   * ### コールバックのタイミング
   * スケジュールされただけではこの関数は呼ばれません.  
   * 関数`refreshState`でユーザ状態を更新するとき、
   * 現在時刻がスケジュールされた時刻を過ぎていると実際にコールバックされます.  
   * つまりスケジュールされた時刻以降で最初に`refreshState`が呼ばれたタイミングでこの関数が呼ばれます.
   */
  onHourCycle?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState

  onFormationChanged?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
  onDencoHPChanged?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
  onLinkSuccess?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
}