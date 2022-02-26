import { SkillHolder } from "./skill";
import { Film } from "./film";
import { StationLink } from "./station";
import { ReadonlyState } from "./user";
export declare type DencoType = "attacker" | "defender" | "supporter" | "trickster";
export declare type DencoAttribute = "cool" | "heat" | "eco" | "flat";
/**
 * でんこ個体の情報
 * 原則として変化する状態を持たない
 */
export interface Denco {
    readonly numbering: string;
    readonly name: string;
    readonly type: DencoType;
    readonly attr: DencoAttribute;
}
/**
 * 状態を保持する
 */
export interface DencoState extends Denco {
    level: number;
    nextExp: number;
    currentExp: number;
    maxHp: number;
    currentHp: number;
    ap: number;
    skill: SkillHolder;
    film: Film;
    link: StationLink[];
}
export declare function copyDencoState(state: ReadonlyState<DencoState>): DencoState;
export declare function copyDencoStateTo(src: ReadonlyState<DencoState>, dst: DencoState): void;
