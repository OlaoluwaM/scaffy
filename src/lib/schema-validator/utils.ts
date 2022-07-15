import { AnyObject } from './types';
import { VALID_RESULT } from './constants';

// Duplicated from utils file in order to make this lib standalone and independent
type RawTypes = Lowercase<
  'Function' | 'Object' | 'Array' | 'Null' | 'Undefined' | 'String' | 'Number' | 'Boolean'
>;
function rawTypeOf(value: unknown): RawTypes {
  return Object.prototype.toString
    .call(value)
    .replace(/\[|\]|object|\s/g, '')
    .toLocaleLowerCase() as RawTypes;
}

export const valueIs = {
  number(val: unknown): val is number {
    return rawTypeOf(val) === 'number' && !Number.isNaN(val);
  },

  string(val: unknown): val is string {
    return rawTypeOf(val) === 'string';
  },

  array(val: unknown): val is unknown[] {
    return rawTypeOf(val) === 'array';
  },

  object(val: unknown): val is AnyObject {
    return rawTypeOf(val) === 'object';
  },
};

export const isEmpty = {
  object(possiblyEmptyObj: AnyObject): boolean {
    const hasNoProperties = Object.keys(possiblyEmptyObj).length === 0;
    return hasNoProperties;
  },

  array(possiblyEmptyArr: unknown[]): boolean {
    return possiblyEmptyArr.length === 0;
  },

  string(possiblyEmptyString: string): boolean {
    const EMPTY_STRING = '' as const;
    return possiblyEmptyString === EMPTY_STRING;
  },

  number(possiblyEmptyNumber: number): boolean {
    return false;
  },
};

export function pickObjPropsToAnotherObj<O extends {}, P extends keyof O>(
  initialObject: O,
  targetProperties: P[],
  excludeProperties: true
): Omit<O, P>;
export function pickObjPropsToAnotherObj<O extends {}, P extends keyof O>(
  initialObject: O,
  targetProperties: P[],
  excludeProperties: false
): Pick<O, P>;
export function pickObjPropsToAnotherObj<O extends {}, P extends keyof O>(
  initialObject: O,
  targetProperties: P[]
): Pick<O, P>;
export function pickObjPropsToAnotherObj<O extends {}, P extends keyof O>(
  initialObject: O,
  targetProperties: P[],
  excludeProperties?: boolean
) {
  const desiredPropertyKeys = extractSetFromCollection(
    Object.keys(initialObject),
    targetProperties,
    excludeProperties
  ) as P[];

  const objWithDesiredProperties = desiredPropertyKeys.reduce((filteredObj, propName) => {
    /* eslint no-param-reassign: ["error", { "props": false }] */
    filteredObj[propName] = initialObject[propName];
    return filteredObj;
  }, {} as O);

  return objWithDesiredProperties;
}

export function extractSetFromCollection<R>(
  superset: unknown[],
  subset: unknown[],
  excludeSubset = false
) {
  return superset.filter(elem => {
    const elemIsInSubset = subset.includes(elem);
    return excludeSubset ? !elemIsInSubset : elemIsInSubset;
  }) as R[];
}

export function nonValidResults(result: unknown): boolean {
  return result !== VALID_RESULT;
}

export function createGrammaticalSentence(
  arrOfWords: string[],
  lastSeparator: 'and' | 'or' = 'and'
): string {
  const arrCopy = [...arrOfWords];

  const lastSentenceElement = `${lastSeparator} ${arrCopy.pop()}`;
  arrCopy.push(lastSentenceElement);

  const sentenceList = arrCopy.join(', ');
  return sentenceList;
}
