// --help/-h is ignored since this handler defaults to helper text
module.exports.handler = userConfig => {
  console.log('in handler')
}

module.exports.flagShorthands = {
  b: 'base',
  a: 'apply',
  d: 'dest'
}

module.exports.flagHasValue = {
  base: true,
  apply: true,
  dest: true
}

module.exports.flagRequired = {
  base: true,
  apply: true,
  dest: true
}
