import { IRNG } from '../irng';
export declare class MersenneTwister extends IRNG {
    private m_seed;
    private mt;
    private mti;
    private MT_sgenrand;
    private MT_genrand;
    private fixupSeeds;
    constructor(_seed?: number);
    _setup(): void;
    init(_seed?: number): void;
    internal_unif_rand(): number;
    seed: number[];
}
