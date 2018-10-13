// --help/-h is ignored since this handler defaults to helper text
module.exports.handler = userConfig => {
  const output = userConfig.flags['version'] ? [{
    title: 'Version',
    text: require('../package.json').version
  }] : [{
    title: 'Usage',
    text: 'aug --src=<src-dir> --apply=<apply-dir> --dest=<dest-dir>'
  }, {
    title: 'Options',
    list: [
      ['--src, -s =<src-dir>', 'Base project directory being augmented'],
      ['--apply, -a =<apply-dir>', 'Directory that will augment the src directory'],
      ['--dest, -d =<dest-dir>', 'Path to where augmented version of project should copy to'],
      ['--dry-run', 'Does not write to destination, and only logs what would have been written'],
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
