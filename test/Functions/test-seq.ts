import seq from "../../src/Functions/seq";

describe("seq", () => {
    it("should generate a sequence of numbers with step 1", () => {
        expect(seq(1, 5, 1)).toEqual([1, 2, 3, 4]);
    });

    it("should generate a sequence with step > 1", () => {
        expect(seq(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
    });

    it("should generate a descending sequence with negative step", () => {
        expect(seq(5, 1, -1)).toEqual([5, 4, 3, 2]);
    });

    it("should handle floating point steps", () => {
        const result = seq(0, 1, 0.5);
        expect(result).toEqual([0, 0.5]);
    });

    it("should exclude the upper bound", () => {
        expect(seq(1, 3, 1)).toEqual([1, 2]);
    });

    it("should return start element if range is smaller than step", () => {
         // (1.5 - 1) / 1 = 0.5 -> floor 0. Array(0). res[0]=1. returns [1]
        expect(seq(1, 1.5, 1)).toEqual([1]);
    });
});
