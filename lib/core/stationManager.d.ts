import { Context } from "./context";
import { Station, StationLink } from "./station";
declare class StationManager {
    data: Station[];
    load(data?: string): Promise<void>;
    clear(): void;
    getRandomStation(context: Context, size: number): Station[];
    getRandomLink(context: Context, size: number, minLinkSec?: number, maxLinkSec?: number): StationLink[];
}
declare const manager: StationManager;
export default manager;
