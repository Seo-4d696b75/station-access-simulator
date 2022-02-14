import { Denco, DencoState } from "./denco";
import { Context } from "./context";
import { Station } from "./station";
import { FormationPosition, ReadonlyState, UserState } from "./user";
/**
 * アクセスにおけるスキルの評価ステップ
 *
 * 以下の順序の各ステップでスキルを評価する
 * ただし、フットバース利用など特殊な状態で一部ステップはスキップされる場合あがある
 *
 * - pink_check フットバース状態にするスキル
 * - probability_check スキル発動などに関わる確率の補正
 * - before_access アクセス開始前の処理（スキル無効化など）
 * - start_access アクセス結果に依らない処理（経験値付与など）
 * - damage_common ATK, DEF の増減
 * - damage_special ATK, DEF以外のダメージ計算
 * - damage_fixed 固定ダメージ値のセット
 * - after_damage ダメージ量やリンク成功などアクセス結果に依存する処理
 *
 * 各ステップは攻撃側→守備側の順序で評価するため、
 * 1. 攻撃側の pink_check
 * 2. 守備側の pink_check
 * 3. 攻撃側の probability_check
 * 4. 守備側の probability_check
 * 5. .....
 * となる
 *
 * 評価される対象スキルは以下の条件を満たすでんこのスキルを編成順に行われる
 * - スキルを保持している
 * - スキルがactive状態
 * - アクセス処理の途中で無効化スキルの影響を受けていない
 */
export declare type AccessEvaluateStep = "pink_check" | "probability_check" | "before_access" | "start_access" | "damage_common" | "damage_special" | "damage_fixed" | "after_damage";
/**
 * アクセス処理の入力・設定を定義します
 */
export interface AccessConfig {
    /**
     * 攻撃側の編成
     */
    offense: {
        state: ReadonlyState<UserState>;
        carIndex: number;
    };
    /**
     * アクセス先の駅
     */
    station: Station;
    /**
     * 守備側の編成
     */
    defense?: {
        state: ReadonlyState<UserState>;
        carIndex: number;
    };
    /**
     * フットバースアイテム使用の有無を指定する
     */
    usePink?: boolean;
}
/**
 * アクセス中における各でんこの立ち位置を表す値
 *
 * - "defense": アクセスを直接受けている（ただひとり、もしくは存在なし）
 * - "offense": アクセスを直接行っている（ただひとり）
 * - "other": "offense, defense"以外の編成内のでんこ
 */
export declare type AccessWho = "offense" | "defense" | "other";
/**
 * アクセス処理中の両編成の各でんこの状態
 */
export interface AccessDencoState extends DencoState {
    which: AccessSide;
    who: AccessWho;
    carIndex: number;
    /**
     * アクセス開始時のHP
     */
    hpBefore: number;
    /**
     * アクセス終了時のHP
     *
     * `hpAfter === 0`の場合は`reboot === true`となり、
     * `currentHP`は最大HPにセットされる
     */
    hpAfter: number;
    /**
     * アクセス処理中においてスキル無効化の影響によりこのでんこが保有するスキルが無効化されているか
     */
    skillInvalidated: boolean;
    /**
     * このアクセスにおいてリブートしたか `hpAfter === 0`と必要十分
     */
    reboot: boolean;
    /**
     * アクセスによって発生したダメージ値
     * 攻撃側・フットバースの使用などによりダメージ計算自体が発生しない場合は `undefined`
     *
     * 通常はアクセス開始時の守備側のみダメージが発生するが、
     * 反撃などで初めの攻撃側や編成内他でんこにダメージが発生する場合もある
     */
    damage?: DamageState;
    /**
     * このアクセス時に発生する経験値
     *
     * - アクセス開始時に付与される経験値
     * - リンク成功時に付与される経験値
     * - スキルによる経験値付与
     * - リブートした場合を除くリンク解除時の経験値付与
     *
     * アクセスによってリブートしたリンクの経験値は含まない
     *
     * 通常はアクセス開始時の攻守ふたりのみ経験値が付与されるが、
     * 反撃・スキルなど編成内他でんこに経験値が付与される場合もある
     */
    accessEXP: number;
}
export interface AccessTriggeredSkill extends Denco {
    readonly step: AccessEvaluateStep;
}
/**
 * アクセス中に発生したダメージ
 */
export interface DamageState {
    /**
     * ダメージの値（０以上の整数）
     */
    value: number;
    /**
     * 属性によるダメージの増量補正が効いているか
     */
    attr: boolean;
}
/**
 * アクセスの攻守ふたりの状態
 */
export interface AccessSideState {
    /**
     * 自身側の編成一覧
     */
    formation: AccessDencoState[];
    /**
     * 編成内における自身の位置
     */
    carIndex: number;
    /**
     * アクセス中に発動したスキル一覧
     */
    triggeredSkills: AccessTriggeredSkill[];
    probabilityBoostPercent: number;
    probabilityBoosted: boolean;
    /**
     * アクセス中に発生したスコア
     *
     * アクセスによりリブートしたリンクのスコアは除くが、
     * リブート以外で解除したリンクスコアは含まれる
     */
    accessScore: number;
    score: number;
    exp: number;
}
/**
 * アクセス中において攻撃・守備側のどちらの編成か判断する値
 */
export declare type AccessSide = "offense" | "defense";
export interface AccessState {
    time: number;
    station: Station;
    offense: AccessSideState;
    defense?: AccessSideState;
    depth: number;
    /**
     * `damage_common`の段階までにおけるダメージの計算値
     *
     * base * (100 + ATK - DEF)/100.0 * (attr_damage_ratio) = damage
     */
    damageBase?: number;
    skipDamageFixed?: boolean;
    /**
     * 固定値で加減算されるダメージ値
     */
    damageFixed: number;
    /**
     * `damage_common`の段階までに評価された`ATK`累積値
     */
    attackPercent: number;
    /**
     * `damage_common`の段階までに評価された`DEF`累積値
     */
    defendPercent: number;
    /**
     * `damage_common`の直後に計算される基本ダメージにおける倍率
     *
     * 現状ではでんこ属性による`1.3`の倍率のみ発生する
     */
    damageRatio: number;
    linkSuccess: boolean;
    linkDisconncted: boolean;
    pinkMode: boolean;
    pinkItemSet: boolean;
    pinkItemUsed: boolean;
}
export declare type AccessResult = {
    access: ReadonlyState<AccessState>;
    offense: UserState & FormationPosition;
    defense?: UserState & FormationPosition;
};
export declare function startAccess(context: Context, config: AccessConfig): AccessResult;
export declare function copyAccessState(state: ReadonlyState<AccessState>): AccessState;
/**
 * アクセスにおける編成（攻撃・守備側）を取得する
 * @param state アクセス状態 {@link AccessState}
 * @param which 攻撃側・守備側のどちらか指定する
 * @throws 存在しない守備側を指定した場合はErrorを投げる
 * @returns `AccessDencoState[]`
 */
export declare function getFormation<T>(state: {
    offense: {
        formation: T;
    };
    defense?: {
        formation: T;
    };
}, which: AccessSide): T;
declare type AccessStateArg<T> = {
    offense: {
        carIndex: number;
        formation: readonly T[];
    };
    defense?: {
        carIndex: number;
        formation: readonly T[];
    };
};
/**
 * アクセスにおいて直接アクセスする・アクセスを受けるでんこを取得する
 * @param state アクセス状態 {@link AccessState}
 * @param which 攻撃側・守備側のどちらか指定
 * @throws 存在しない守備側を指定した場合Error
 * @returns {@link AccessDencoState}
 */
export declare function getAccessDenco<T>(state: AccessStateArg<T>, which: AccessSide): T;
/**
 * アクセスの守備側の状態を取得する
 * @param state
 * @returns {@link AccessSideState}
 * @throws 守備側が存在しない場合はError
 */
export declare function getDefense<T>(state: {
    defense?: T;
}): T;
/**
 * 指定したでんこのスキルが発動済みか確認する
 *
 * １度目のスキル発動における各コールバック呼び出しのタイミングでの返値の変化は次のとおり
 * - `Skill#canEvaluate` : `false`
 * - `Skill#evaluate` : `true`
 * @param state
 * @param denco
 * @param step `undefined`の場合は`denco`の一致でのみ検索する
 * @returns true if has been triggered
 */
export declare function hasSkillTriggered(state: ReadonlyState<AccessSideState> | undefined, denco: Denco, step?: AccessEvaluateStep): boolean;
/**
 * 確率計算モードを考慮してtrue/falseの条件を計算する
 *
 * {@link RandomMode} の値に応じて乱数計算を無視してtrue/falseを返す場合もある
 * 計算の詳細
 * 1. `percent <= 0` -> `false`
 * 2. `percent >= 100` -> `true`
 * 3. `context.random.mode === "ignore"` -> `false`
 * 4. `context.random.mode === "force"` -> `true`
 * 5. `context.random.mode === "normal"` -> 疑似乱数を用いて`percent`%の確率で`true`を返す
 * @param percent 100分率で指定した確率でtrueを返す
 * @returns
 */
export declare function random(context: Context, percent: number): boolean;
/**
 * 攻守はそのままでアクセス処理を再度実行する
 *
 * @param state 現在のアクセス状態
 * @returns ダメージ計算・スコアと経験値の加算など各処理を再度実行して合計値を反映した新たな状態を返す
 */
export declare function repeatAccess(context: Context, state: ReadonlyState<AccessState>): AccessState;
/**
 * カウンター攻撃を処理する
 *
 * 攻守を入れ替えて通常同様の処理を再度実行する
 *
 * @param context
 * @param state 現在の状態
 * @param denco カウンター攻撃の主体 現在の守備側である必要あり
 * @returns カウンター攻撃終了後の状態
 */
export declare function counterAttack(context: Context, current: ReadonlyState<AccessState>, denco: Denco): AccessState;
export {};
