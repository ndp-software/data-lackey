import UrlPattern         from 'url-pattern'
import AbstractUrlPattern from './AbstractUrlPattern'

const DEFAULT_PATTERN_OPTS = {
  segmentNameStartChar: '$',
  segmentValueCharset:  'a-zA-Z0-9\\-,_%~\\.!\\*\\(\\)',
}

export default class StringMatcher extends AbstractUrlPattern {
  constructor (pattern, patternOptOverrides) {
    super(new UrlPattern(pattern,
                         {
                           ...DEFAULT_PATTERN_OPTS,
                           ...(patternOptOverrides || {}),
                         }))
  }
}

