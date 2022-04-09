import ArrayValidator from './validators/array';
import ObjectValidator from './validators/object';

import { InterfaceToValidatorSchema } from './types';
import { StringValidator, NumberValidator } from './validators/primitives';

export type { InterfaceToValidatorSchema };
export { ArrayValidator, ObjectValidator, StringValidator, NumberValidator };
