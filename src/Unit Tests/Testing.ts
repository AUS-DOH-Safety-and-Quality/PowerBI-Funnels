import getLimitsArray from "../getLimitsArray";
import * as mocha from 'mocha';
import * as chai from 'chai';

const expect = chai.expect;

let numerator: number[] = [0, 2, 3, 1];
let denominator: number[] = [5, 4, 10, 3];
let maxDenominator: number = 10;
let data_type: string = "PR";
let OD: string = "no";

let test_array: number[][] = getLimitsArray(numerator, denominator, maxDenominator, data_type, OD);

describe('My math library', () => {
    it('should be able to add things correctly' , () => {
      expect(test_array[0][0]).to.equal(1);
    });
  
  });