const fs = require('fs')
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
    await this.tree.build()
    await generateDest(this.tree, this.dest)
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

  async build() {
    Object.assign(this, await walk(this.src, this.apply))
    return this
  }
}

class TerminalResource {
  constructor(props) {
    this.props = props
  }
}

const emptyDirState = Object.freeze({ list: Object.freeze([]), stats: Object.freeze({}), path: null })
async function walk(src, apply) {
  const origin = {
    src: src ? await dir(src) : emptyDirState,
    apply: apply ? await dir(apply) : emptyDirState
  }

  // full array of resource names
  const list = origin.src.list.concat(origin.apply.list)

  const result = {}

  for (const resource of list) {
    // attempt to use apply origin, else fallback to src
    const originUsed = origin.apply.list.includes(resource) ? 'apply' : 'src'
    const specificOrigin = origin[originUsed]
    const stats = specificOrigin.stats[resource]

    // determine if this is a terminal resource
    // any non-directory is terminal
    // any directory that _only_ exists in one origin is terminal
    // ^ this will result in directories not being walked if not needed
    
    const resourceProps = {
      stats,
      path: path.resolve(specificOrigin.path, resource)
    }

    // if a non-directory,
    // or from src dir,
    // then it's terminal
    if (originUsed === 'src' || !stat.isDirectory()) {
      result[resource] = new TerminalResource(resourceProps)
      continue
    }

    const srcStats = origin.src.stats[resource]
    const srcHasResourceDir = srcStats && srcStats.isDirectory()

    // if src does not have a diretory, then it's terminal
    if (!srcHasResourceDir) {
      result[resource] = new TerminalResource(resourceProps)
      continue
    }

    // walk deeper
    result[resource] = await walk(
      srcHasResourceDir ? path.resolve(src, resource) : null,
      path.resolve(apply, resource)
    )

    // if (specificOrigin.stats[resource].isSymbolicLink()) {
    //   await copy(path.resolve(specificOrigin, resource), path.resolve())
    // }
  }
}

function dir(path) {
  return new Promise((resolve, reject) => {
    // would like to use withFileTypes but it's not avail until node v10.10.0
    fs.readdir(path, {
      encoding: 'utf8',
      withFileTypes: true
    }, async (err, list) => {
      if (err) {
        return reject(err)
      }

      // get all file stats
      // { 'config.yml': <fs.Stats> }
      const eachResult = await Promise.all(list.map(resource => stat(path, resource)))
      resolve({
        path,
        list,
        // return flattened object
        stats: Object.assign({}, ...eachResult)
      })
    })
  })
}

function stat(resourceDir, resource) {
  return new Promise((resolve, reject) => {
    fs.stat(path.resolve(resourceDir, resource), (err, stats) => {
      if (err) {
        return reject(err)
      }

      resolve({
        [resource]: stats
      })
    })
  })
}

function copy(originPath, destPath) {
  return new Promise((resolve, reject) => {
    fs.copyFile(originPath, destPath, fs.constants.COPYFILE_EXCL, err => {
      if (err) {
        return reject(err)
      }
      resolve()
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
