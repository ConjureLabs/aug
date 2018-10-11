const helpers = require('./aug.helpers')

// wrapping base code in a func so it can `return`
// without webpack complaining
function aug() {
  const argv = process.argv
  let srcExecution = false
  if (/\/node$/.test(argv[0])) {
    srcExecution = true
    argv.shift()
  }
  argv.shift() // "aug" or "aug.js"

  const startingDash = /^--?/
  const userConfig = argv.reduce((userConfig, token) => {
    if (startingDash.test(token)) {
      userConfig.flags[ token.replace(startingDash, '') ] = token
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
      // 'version': '--version'
    }
  })

  // "aug" or "aug --help" will output base helper text
  const commandRaw = userConfig.command === null ? 'help' : userConfig.command
  // sanitizing user command to avoid requiring in files like config.default.json
  const commandUsed = commandRaw.replace(/[^a-z]*/i, '').toLowerCase()
  let commandHandler
  let commandFlagShorthands
  try {
    commandResource = require(`./${commandUsed}`)
    commandHandler = commandResource.handler
    commandFlagShorthands = commandResource.flagShorthands
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

  if (commandFlagShorthands) {
    userConfig.flags = mapFlags(userConfig.flags, commandFlagShorthands)
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

aug()
