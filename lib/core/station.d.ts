import { AccessSide } from "./access";
import { DencoState } from "./denco";
import { ReadonlyState } from "./user";
export declare type StationAttribute = "eco" | "heat" | "cool" | "unknown";
export declare type Station = Readonly<{
    name: string;
    nameKana: string;
    attr: StationAttribute;
}>;
export interface StationLink extends Station {
    readonly start: number;
}
export interface LinkResult extends StationLink {
    readonly end: number;
    readonly duration: number;
    readonly score: number;
    readonly matchBonus?: number;
}
export declare type LinksResult = Readonly<{
    /**
     * リブートしたタイミング
     */
    time: number;
    /**
     * リブートしてリンクスコア＆経験値が加算される直前の状態
     * リブートしたリンクは解除されている
     */
    denco: ReadonlyState<DencoState>;
    which: AccessSide;
    link: readonly LinkResult[];
    totalScore: number;
    linkScore: number;
    comboBonus: number;
    matchBonus: number;
    matchCnt: number;
    exp: number;
}>;
