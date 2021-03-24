import * as debug from 'debug';
export declare const M_SQRT2 = 1.4142135623730951;
export declare const frac: (x: number) => number;
export declare const M_SQRT_32 = 5.656854249492381;
export declare const DBL_MANT_DIG = 18;
export declare const M_LN2 = 0.6931471805599453;
export declare const M_1_SQRT_2PI = 0.3989422804014327;
export declare const M_2PI = 6.283185307179586;
export declare const M_LN_2PI = 1.8378770664093456;
export declare const M_1_PI: number;
export declare const M_PI_2: number;
export declare const M_LN_SQRT_PI = 0.5723649429247001;
export declare const M_LN_SQRT_2PI = 0.9189385332046728;
export declare const M_LN_SQRT_PId2 = 0.22579135264472744;
export declare const M_SQRT_2dPI = 0.7978845608028654;
export declare const M_LOG10_2 = 0.3010299956639812;
export declare const DBL_MAX_EXP: number;
export declare const DBL_MIN_EXP: number;
export declare const R_D__1: (logP: boolean) => 0 | 1;
export declare const R_D__0: (logP: boolean) => number;
export declare const R_DT_0: (lower_tail: boolean, log_p: boolean) => number;
export declare const R_DT_1: (lower_tail: boolean, log_p: boolean) => number;
export declare const R_D_val: (log_p: boolean, x: number) => number;
export declare function R_D_Clog(log_p: boolean, p: number): number;
export declare function R_DT_val(lower_tail: boolean, log_p: boolean, x: number): number;
export declare function imin2(x: number, y: number): number;
export declare function R_D_Lval(lowerTail: boolean, p: number): number;
export declare function R_D_Cval(lowerTail: boolean, p: number): number;
export declare function R_P_bounds_Inf_01(lowerTail: boolean, log_p: boolean, x: number): number | undefined;
export declare function R_D_half(log_p: boolean): number;
export declare function R_P_bounds_01(lower_tail: boolean, log_p: boolean, x: number, x_min: number, x_max: number): number | undefined;
export declare const R_D_exp: (log_p: boolean, x: number) => number;
export declare enum ME {
    ME_NONE = 0,
    ME_DOMAIN = 1,
    ME_RANGE = 2,
    ME_NOCONV = 4,
    ME_PRECISION = 8,
    ME_UNDERFLOW = 16
}
export declare const mapErr: Map<ME, string>;
export declare const ML_ERROR: (x: ME, s: any, printer: debug.IDebugger) => void;
export declare function ML_ERR_return_NAN(printer: debug.IDebugger): number;
export declare function R_D_nonint_check(log: boolean, x: number, printer: debug.IDebugger): number | undefined;
export declare function fmod(x: number, y: number): number;
export declare function imax2(x: number, y: number): number;
export declare function isOdd(k: number): boolean;
export declare function epsilonNear(x: number, target: number): number;
export declare function isEpsilonNear(x: number, target: number): boolean;
export declare function R_D_negInonint(x: number): boolean;
export declare function R_nonint(x: number): boolean;
export declare function R_D_fexp(give_log: boolean, f: number, x: number): number;
export declare const nsig_BESS = 16;
export declare const ensig_BESS = 10000000000000000;
export declare const rtnsig_BESS = 0.0001;
export declare const enmten_BESS = 8.9e-308;
export declare const enten_BESS = 1e+308;
export declare const exparg_BESS = 709;
export declare const xlrg_BESS_IJ = 100000;
export declare const xlrg_BESS_Y = 100000000;
export declare const thresh_BESS_Y = 16;
export declare const xmax_BESS_K = 705.342;
export declare const sqxmin_BESS_K = 1.49e-154;
export declare const M_eps_sinc = 2.149e-8;
export declare function R_pow_di(x: number, n: number): number;
export declare function R_pow(x: number, y: number): number;
export declare const R_finite: (x: number) => boolean;
export declare const R_isnancpp: (x: number) => boolean;
export declare function myfmod(x1: number, x2: number): number;
export declare function R_powV(x: number, y: number): number;
export declare function ldexp(x: number, y: number): number;
export declare function R_D_log(log_p: boolean, p: number): number;
export declare function R_Q_P01_boundaries(lower_tail: boolean, log_p: boolean, p: number, _LEFT_: number, _RIGHT_: number): number | undefined;
export declare function R_Q_P01_check(logP: boolean, p: number): number | undefined;
export declare function R_D_qIv(logP: boolean, p: number): number;
