import { BaseValidatorOptions, ValidatorTypes } from '../types';

export interface ObjValidationOptions extends BaseValidatorOptions {
  readonly filterViolations: boolean;
}

export interface StringValidatorOptions extends BaseValidatorOptions {
  readonly options: readonly string[];
}

type ValidatorTypesWithCustomOptions = 'string' | 'object';
type ValidatorTypesWithoutCustomOptions =
  | Exclude<ValidatorTypes, ValidatorTypesWithCustomOptions>
  | 'base';

export type ValidatorOptionsCollection = {
  readonly [key in ValidatorTypesWithoutCustomOptions]: BaseValidatorOptions;
} & {
  readonly string: StringValidatorOptions;
  readonly object: ObjValidationOptions;
};

const baseValidatorOptions: BaseValidatorOptions = {
  allowEmpty: true,
};

const defaultObjValidationOptions: ObjValidationOptions = {
  filterViolations: false,
  allowEmpty: true,
};

const defaultStringValidationOptions: StringValidatorOptions = {
  ...baseValidatorOptions,
  options: [],
};

export type ValidatorOptions =
  | StringValidatorOptions
  | ObjValidationOptions
  | BaseValidatorOptions;

const defaultValidatorOptionsFor: ValidatorOptionsCollection = {
  object: defaultObjValidationOptions,
  array: baseValidatorOptions,
  string: defaultStringValidationOptions,
  number: baseValidatorOptions,
  base: baseValidatorOptions,
};

export default defaultValidatorOptionsFor;
