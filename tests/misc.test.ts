/* global test, expect, describe */
import updateImportStatements from '../fixCompiledImports.mjs';

describe('Tests for compiled JS import statement patch', () => {
  const cases = [
    [
      `
    import "zx/globals"

    import { fao } from "baz.js"
    import { far } from "url"
    import { foo } from "some"

    import bar from 'foo'
    import * from "aa"
    `,
      `
    import "zx/globals"

    import { fao } from "baz.js"
    import { far } from "url"
    import { foo } from "some.js"

    import bar from 'foo.js'
    import * from "aa.js"
    `,
    ],
    [
      `
    import "zx/globals"import { fao } from "baz.js"import { far } from "url"import { foo } from "some"
    import bar from 'foo'import * from "aa"`,
      `
    import "zx/globals"import { fao } from "baz.js"import { far } from "url"import { foo } from "some.js"
    import bar from 'foo.js'import * from "aa.js"`,
    ],
  ];
  test.each(cases)(
    'Should make sure that regex can be used to make desired TS import correction',
    (sampleImports, desiredOutput) => {
      // Arrange

      // Act
      const output = updateImportStatements(sampleImports);

      // Assert
      expect(output).toBe(desiredOutput);
    }
  );
});
