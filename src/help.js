// --help/-h is ignored since this handler defaults to helper text
module.exports.handler = userConfig => {
  const output = userConfig.flags['version'] ? [{
    title: 'Version',
    text: require('../package.json').version
  }] : [{
    title: 'Usage',
    text: 'aug --base=<base-dir> --apply=<apply-dir> --dest=<dest-dir>'
  }, {
    title: 'Options',
    list: [
      ['--base, -b =<base-dir>', 'Base project directory being augmented'],
      ['--apply, -a =<apply-dir>', 'Directory that will augment the base project'],
      ['--dest, -d =<dest-dir>', 'Path to where augmented version of project should copy to'],
      ['--help, -h', 'List commands and options'],
      ['--version, -v', 'Display installed version']
    ]
  }]

  const helpers = require('./aug.helpers')
  console.log(helpers.helpOutput(output))
  process.exit(0)
}

module.exports.flagShorthands = {
  v: 'version'
}
