// NOTE: Some types are duplicated from the app's utils file in order to make this lib standalone and independent

type Primitive = string | number;

export type AnyObject = Record<Primitive, unknown>;

export type ValidationPath = string[];

export interface ValidatorInput<InputType = unknown> {
  readonly value: InputType;
  readonly path: ValidationPath;
}

export interface ValidationResultError {
  readonly path: ValidationPath;
  readonly issue: string;
}

export interface ValidationResult<ResultType> {
  readonly value: ResultType;
  readonly isValid: boolean;
  readonly errors: ValidationResultError[];
}

export interface BaseValidatorOptions {
  readonly allowEmpty: boolean;
}

export type Validator<ForType> = (
  vI: ValidatorInput<ForType>
) => ValidationResult<ForType>;

export type InterfaceToValidatorSchema<I> = {
  [Key in keyof I]: Validator<I[Key]>;
};

export type ValidatorTypes = 'string' | 'number' | 'object' | 'array';

type ValidatorSchemaToInterface<VS> = {
  [Key in keyof VS]: VS[Key] extends Validator<infer R> ? R : VS[Key];
};

export type isOptional<Structure, MemberUnion extends keyof Structure> = Omit<
  Structure,
  MemberUnion
> &
  Partial<Pick<Structure, MemberUnion>>;

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
