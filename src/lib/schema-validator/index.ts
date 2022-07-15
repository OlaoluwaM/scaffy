import ArrayValidator from './validators/array';
import StringValidator from './validators/string';
import ObjectValidator from './validators/object';

import { Or } from './validators/predicate';
import { InterfaceToValidatorSchema } from './types';
import { NumberValidator } from './validators/primitives';

export type { InterfaceToValidatorSchema };
export { ArrayValidator, ObjectValidator, StringValidator, NumberValidator, Or };
