const chalk = require('chalk')

const padLeft = '  '

module.exports = {}

// 1 = fatal error
module.exports.fatal = message => {
  message = message.replace(/^|\n|\r+/g, `\n${padLeft}`)
  console.log(`${chalk.red(message)}\n`)
  process.exit(1)
}

// boldens text
module.exports.bold = text => {
  return chalk.bold(text)
}

// underlines text
module.exports.underline = text => {
  return chalk.underline(text)
}

// takes in structured helper output, and returns console.log ready text
/*
  // `output` is an array of structured & sectioned text.
  // You should not mix scenarios within a single section.
  // Every section requires a `title`
  // Possible sections are as follows.

  // prints a title, and accompanying text
  {
    title: 'Usage',
    text: 'conjure [command] [arguments] [options]'
  }

  // prints a title, and then has a newline seperated & aligned list of values
  {
    title: 'Options',
    list: [
      ['--help, -h', 'List commands and options'],
      ['--version, -v', 'Display installed version']
    ]
  }
 */
module.exports.helpOutput = output => {
  // collecting out output keys, across sections, to ensure that they align together in result
  const allOutputKeys = []
  for (let i = 0; i < output.length; i++) {
    if (output[i].list) {
      allOutputKeys.push(...output[i].list.map(subArray => module.exports.bold(subArray[0])))
    }
  }
  const paddedKeys = equalWidths(allOutputKeys, 6)

  const resultSectioned = output.reduce((result, section) => {
    const title = module.exports.bold(module.exports.underline(section.title) + ':')

    if (section.text) {
      result.push(`${title} ${section.text}`)
    }

    // a list is basically key value pairs, but in an arary format
    if (section.list) {
      let sectionResult = title
      for (let i = 0; i < section.list.length; i++) {
        sectionResult += `\n${padLeft}${paddedKeys.shift()}${section.list[i][1]}`
      }
      result.push(sectionResult)
    }

    return result
  }, [])

  return `\n${resultSectioned.join('\n\n')}\n`
}

// takes in an array of strings,
// and returns a modified version
// where all values have been padded
// to equal the longest's,
// plus extra amount as specified
function equalWidths(strings, extraPadding = 0) {
  const longestLen = strings.reduce((longestLen, str) => {
    if (str.length > longestLen) {
      return str.length
    }
    return longestLen
  }, 0)

  return strings.map(str => str + ' '.repeat(longestLen - str.length + extraPadding))
}
