export interface IdmultinomOptions {
    x: number[];
    size?: number;
    prob: number[];
    asLog?: boolean;
}
export declare function dmultinom(o: IdmultinomOptions): number;
