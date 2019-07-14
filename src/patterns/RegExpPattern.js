import UrlPattern from 'url-pattern'
import AbstractUrlPattern from './AbstractUrlPattern'

export default class RegExpPattern extends AbstractUrlPattern {
  constructor (pattern, groupNames) {
    super(new UrlPattern(pattern, groupNames))
  }
}
