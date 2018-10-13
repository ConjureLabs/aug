require('@conjurelabs/utils/process/handle-exceptions')

const helpers = require('./aug.helpers')

// wrapping base code in a func so it can `return`
// without webpack complaining
function aug() {
  let argv = process.argv
  let srcExecution = false
  if (/\/node$/.test(argv[0])) {
    srcExecution = true
    argv.shift()
  }
  argv.shift() // "aug" or "aug.js"

  const startingDash = /^-{1,2}/
  const flagValue = /^(\w[\w-]*)=(\S+)$/
  const userConfig = argv.reduce((userConfig, token) => {
    if (startingDash.test(token)) {
      const tokenStripped = token.replace(startingDash, '')
      const valueMatch = flagValue.exec(tokenStripped)
      if (!valueMatch) {
        userConfig.flags[tokenStripped] = tokenStripped
      } else {
        userConfig.flags[ valueMatch[1] ] = token
        userConfig.flagValues[ valueMatch[1] ] = valueMatch[2]
      }
      return userConfig
    }

    if (userConfig.command === null) {
      userConfig.command = token
    } else {
      userConfig.args.push(token)
    }

    return userConfig
  }, {
    command: null,
    args: [
      // non-flag args after comand
    ],
    flags: {
      // 'dest': 'd' // if used '-d'
    },
    flagValues: {
      // 'dest': '../some-dir'
    }
  })

  // "aug" or "aug --help" will output base helper text
  const commandRaw = userConfig.command === null && !userConfig.flags.help ? 'apply' : userConfig.command
  // sanitizing user command to avoid requiring in files like config.default.json
  const commandUsed = (commandRaw || 'help').replace(/[^a-z]*/i, '').toLowerCase()
  let commandHandler
  let commandFlagShorthands
  let commandFlagHasValue
  let commandRequiredFlags
  try {
    commandResource = require(`./${commandUsed}`)
    commandHandler = commandResource.handler
    commandFlagShorthands = commandResource.flagShorthands || {}
    commandFlagHasValue = commandResource.flagHasValue || {}
    commandFlagRequired = commandResource.flagRequired || {}
  } catch(err) {
    // if firing directly (node ./src/aug.js), then allow err on stdout
    if (srcExecution) {
      console.log(err)
    }
    if (err.message.includes('Cannot find module')) {
      return helpers.fatal(`${helpers.bold(commandRaw)} is not a valid command - Run ${helpers.bold("aug --help")} to see valid commands`)
    }
    // valid file error at this point
    return helpers.fatal(`${helpers.bold(commandRaw)} cannot be executed (${err.constructor.name}) - This is likely an issue with the CLI itself - please file a bug at https://github.com/ConjureLabs/conjure-cli/issues`)
  }

  if (typeof commandHandler !== 'function') {
    return helpers.fatal(`${helpers.bold(commandRaw)} cannot be executed (no handler defined) - This is likely an issue with the CLI itself - please file a bug at https://github.com/ConjureLabs/conjure-cli/issues`)
  }

  userConfig.flags = mapFlags(userConfig.flags, commandFlagShorthands)
  userConfig.flagValues = mapFlagValues(userConfig.flagValues, commandFlagShorthands)

  const fatalErrors = []

  for (let key in commandFlagRequired) {
    if (userConfig.flags[key] == undefined) {
      const flagUsed = userConfig.flags[key] || key
      const commandExample = commandFlagHasValue[key] ? `--${flagUsed}=somevalue` : `--${flagUsed}`
      fatalErrors.push(`${helpers.bold(commandExample)} is required`)
    }
  }

  for (let key in commandFlagHasValue) {
    if (userConfig.flags[key] != undefined && userConfig.flagValues[key] == undefined) {
      const flagUsed = userConfig.flags[key] || key
      fatalErrors.push(`${helpers.bold('--' + flagUsed)} requires a value (e.g. --${flagUsed}=somevalue)`)
    }
  }

  if (fatalErrors.length) {
    return helpers.fatal(fatalErrors.join('\n'))
  }

  commandHandler(userConfig)
}

// takes in a command handler's flags,
// with shorthand pairings,
// and returns an object with only the full string keys
// e.g. { 'v': '-v' } with shorthand pairings { 'v': 'version' } is { 'version', '-v' }
// this makes it easier to use the keys
function mapFlags(flags, shorthands) {
  return Object.keys(flags).reduce((mapped, key) => {
    mapped[ shorthands[key] || key ] = flags[key]
    return mapped
  }, {})
}

// takes in a command handler's flag values,
// with shorthand pairings,
// and returns an object with only the full string keys
// e.g. { 'v': '12' } with shorthand pairings { 'v': 'version' } is { 'version', '12' }
// this makes it easier to use the keys
function mapFlagValues(flagValues, shorthands) {
  return Object.keys(flagValues).reduce((mapped, key) => {
    mapped[ shorthands[key] || key ] = flagValues[key]
    return mapped
  }, {})
}

aug()
