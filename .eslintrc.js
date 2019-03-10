module.exports = {
  extends:         [
    'plugin:promise/recommended',
    'eslint:recommended',
  ],
  parser:          'babel-eslint',
  'parserOptions': {
    'ecmaVersion':  6,
    'sourceType':   'module',
    'ecmaFeatures': {
      'jsx':                          true,
      'modules':                      true,
      'experimentalObjectRestSpread': true,
    },
  },
  'plugins':       [
    'babel',
    'import',
    'no-for-of-loops',
    'promise',
    'standard',
    'no-only-tests',
  ],
  settings: {
    "import/resolver": {
      "babel-module": {},
    },
    // "react"          : {
    //   // "createClass": "createReactClass", // Regex for Component Factory to use, default to "createReactClass"
    //   "pragma" : "React",  // Pragma to use, default to "React"
    //   "version": "15.4" // React version, default to the latest React stable release
    // }
  },
  'rules':         {
    'arrow-parens':                      [2, 'as-needed'],
    'babel/new-cap':                     [0],
    'babel/array-bracket-spacing':       [0],
    'babel/object-curly-spacing':        [0],
    'camelcase':                         ['error'],
    'comma-dangle':                      [0],
    'complexity':                        ['error', 14],
    'generator-star-spacing':            [1],
    'import/imports-first':              ['error'],
    'import/no-unresolved':              ['error'],
    'import/default':                    ['error'],
    'import/named':                      ['error'],
    'import/no-named-as-default-member': ['error'],
    'import/no-mutable-exports':         ['error'],
    'indent':                            [0, 2],
    'linebreak-style':                   ['error', 'unix'],
    'max-params':                        ['error', 3],
    'new-cap':                           [0],
    'no-await-in-loop':                  [1],
    'no-confusing-arrow':                [0],
    'no-console':                        [2],
    'no-constant-condition':             ['off'],
    'no-duplicate-imports':              ['error'],
    'no-for-of-loops/no-for-of-loops':   ['error'],
    'no-negated-condition':              ['error'],
    'no-only-tests/no-only-tests':       ['error'],
    'no-useless-rename':                 ['error'],
    'no-unused-vars':                    ['error', { args: 'all', argsIgnorePattern: '^_' }],
    'no-var':                            ['error'],
    'prefer-const':                      ['error'],
    'prefer-rest-params':                ['error'],
    'prefer-spread':                     ['error'],
    'quotes':                            ['error', 'single'],
    'semi':                              ['error', 'never'],
  },
  'globals':       {
    'console': true,
    'Promise': true,
    'window':  true,
  },
}
