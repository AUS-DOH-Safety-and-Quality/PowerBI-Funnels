import { IRNG } from '../';
import { IRNGNormal } from './inormal-rng';
export declare class BoxMuller extends IRNGNormal {
    private BM_norm_keep;
    private reset;
    constructor(_rng?: IRNG);
    protected internal_norm_rand(): number;
}
