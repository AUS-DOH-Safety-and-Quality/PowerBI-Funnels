import * as math from '@stdlib/math/base/special'
import { sqrt, exp, log, asin, inv, square } from "../src/Function Broadcasting/UnaryFunctions"

test('sqrt', () => {
  let inputs: number[] = [1, 4, 9];
  let outputs: number[] = [1, 2, 3];
  expect(sqrt(inputs)).toMatchObject(outputs);
});

test('exp', () => {
  let inputs: number[] = [0.5, 1.4, -9];
  let outputs: number[] = inputs.map(d => math.exp(d));
  expect(exp(inputs)).toMatchObject(outputs);
});

test('log', () => {
  let inputs: number[] = [-25, 1.2, 100];
  let outputs: number[] = inputs.map(d => Math.log(d));
  expect(log(inputs)).toMatchObject(outputs);
});

test('asin', () => {
  let inputs: number[] = [-25, 1.2, 100];
  let outputs: number[] = inputs.map(d => Math.asin(d));
  expect(asin(inputs)).toMatchObject(outputs);
});

test('inv', () => {
  let inputs: number[] = [-25, 1.2, 100];
  let outputs: number[] = inputs.map(d => 1 / d);
  expect(inv(inputs)).toMatchObject(outputs);
});

test('square', () => {
  let inputs: number[] = [-25, 1.2, 100];
  let outputs: number[] = inputs.map(d => d * d);
  expect(square(inputs)).toMatchObject(outputs);
});
