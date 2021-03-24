import { IRNG } from './irng';
import { KnuthTAOCP } from './knuth-taocp';
import { KnuthTAOCP2002 } from './knuth-taocp-2002';
import { LecuyerCMRG } from './lecuyer-cmrg';
import { MarsagliaMultiCarry } from './marsaglia-multicarry';
import { MersenneTwister } from './mersenne-twister';
import { AhrensDieter, BoxMuller, BuggyKindermanRamage, Inversion, KindermanRamage } from './normal';
import { IRNGNormal } from './normal/inormal-rng';
import { SuperDuper } from './super-duper';
import { timeseed } from './timeseed';
import { WichmannHill } from './wichmann-hill';
export declare const rng: {
    KnuthTAOCP: typeof KnuthTAOCP;
    KnuthTAOCP2002: typeof KnuthTAOCP2002;
    LecuyerCMRG: typeof LecuyerCMRG;
    MarsagliaMultiCarry: typeof MarsagliaMultiCarry;
    MersenneTwister: typeof MersenneTwister;
    normal: {
        AhrensDieter: typeof AhrensDieter;
        BoxMuller: typeof BoxMuller;
        BuggyKindermanRamage: typeof BuggyKindermanRamage;
        Inversion: typeof Inversion;
        KindermanRamage: typeof KindermanRamage;
    };
    SuperDuper: typeof SuperDuper;
    timeseed: typeof timeseed;
    WichmannHill: typeof WichmannHill;
};
export { IRNG, IRNGNormal };
