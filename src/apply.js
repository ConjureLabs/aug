const { readdir, stat } = require('fs')
const path = require('path')

// --help/-h is ignored since this handler defaults to helper text
module.exports.handler = async userConfig => {
  await new Project(userConfig).augment()
}

class Project {
  constructor(userConfig) {
    this.src = userConfig.flagValues.src
    this.apply = userConfig.flagValues.apply
    this.dest = userConfig.flagValues.dest
  }

  async augment() {
    this.tree = new Tree(this.src, this.apply)
    await this.tree.walk()
    // await this.buildTree()
  }
}

class Tree {
  constructor(src, apply) {
    Object.defineProperty(this, 'src', {
      value: src,
      enumerable: false
    })

    Object.defineProperty(this, 'apply', {
      value: apply,
      enumerable: false
    })
  }

  async walk() {
    const src = await dir(this.src)
    const apply = await dir(this.apply)

    console.log(this)
  }
}

function dir(path) {
  return new Promise((resolve, reject) => {
    // would like to use withFileTypes but it's not avail until node v10.10.0
    readdir(path, {
      encoding: 'utf8',
      withFileTypes: true
    }, async (err, list) => {
      if (err) {
        return reject(err)
      }

      // get all file stats
      // { resource: 'filename', stats: <fs.Stats> }
      resolve(await Promise.all(list.map(resource => resourceStat(path, resource))))
    })
  })
}

function resourceStat(resourceDir, resource) {
  return new Promise((resolve, reject) => {
    stat(path.resolve(resourceDir, resource), (err, stats) => {
      if (err) {
        return reject(err)
      }

      resolve({
        resource,
        stats
      })
    })
  })
}

module.exports.flagShorthands = {
  s: 'src',
  a: 'apply',
  d: 'dest'
}

module.exports.flagHasValue = {
  src: true,
  apply: true,
  dest: true
}

module.exports.flagRequired = {
  src: true,
  apply: true,
  dest: true
}
