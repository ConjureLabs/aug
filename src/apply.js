// --help/-h is ignored since this handler defaults to helper text
module.exports.handler = userConfig => {
  console.log(userConfig)
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

module.exports.requiredFlags = {
  base: true,
  apply: true,
  dest: true
}
