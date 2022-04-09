import { BaseValidatorOptions, ValidatorTypes } from '../types';

export interface ObjValidationOptions extends BaseValidatorOptions {
  readonly filterViolations?: boolean;
}

type ValidatorOptionsCollection = {
  readonly [key in ValidatorTypes | 'base']: BaseValidatorOptions;
};

const baseValidatorOptions: BaseValidatorOptions = {
  allowEmpty: true,
};

const defaultObjValidationOptions: ObjValidationOptions = {
  filterViolations: false,
  allowEmpty: true,
};

const defaultValidatorOptionsFor: ValidatorOptionsCollection = {
  object: defaultObjValidationOptions,
  array: baseValidatorOptions,
  string: baseValidatorOptions,
  number: baseValidatorOptions,
  base: baseValidatorOptions,
};

export default defaultValidatorOptionsFor;
