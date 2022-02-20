/* global test, expect */
import updateImportStatements from '../fixCompiledImports.mjs';

test('Should make sure that regex can be used to make desired TS import correction', () => {
  // Arrange
  const testFileSnippet = `
    import "zx/globals"

    import { fao } from "baz.js"
    import { far } from "url"
    import { foo } from "some"

    import bar from 'foo'
    import * from "aa"
    `;

  const desiredFileSnippet = `
    import "zx/globals"

    import { fao } from "baz.js"
    import { far } from "url"
    import { foo } from "some.js"

    import bar from 'foo.js'
    import * from "aa.js"
    `;

  // Act
  const output = updateImportStatements(testFileSnippet);

  // Assert
  expect(output).toBe(desiredFileSnippet);
});
