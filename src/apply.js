const fs = require('fs')
const path = require('path')
const ignore = require('ignore')

const helpers = require('./aug.helpers')

let dryRun = false

// --help/-h is ignored since this handler defaults to helper text
module.exports.handler = async userConfig => {
  if (userConfig.flags['dry-run']) {
    dryRun = true
  }
  await new Project(userConfig).augment()
}

class Project {
  constructor(userConfig) {
    this.src = userConfig.flagValues.src
    this.apply = userConfig.flagValues.apply
    this.dest = userConfig.flagValues.dest
  }

  async augment() {
    const tree = new Tree(this.src, this.apply)
    await tree.build()
    await generateDest(tree, this.dest)
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
    Object.assign(this, await walk({
      root: this.src,
      path: this.src,
      ignore: ignore()
    }, {
      root: this.apply,
      path: this.apply,
      ignore: ignore()
    }))
  }
}

class TerminalResource {
  constructor(props) {
    Object.assign(this, props)
  }
}

const emptyDirState = Object.freeze({ list: Object.freeze([]), stats: Object.freeze({}), root: null, path: null, ignore: null })
async function walk(src, apply) {
  const origin = {
    src: src ? await dir(src.path, src.root, src.ignore) : emptyDirState,
    apply: apply ? await dir(apply.path, apply.root, apply.ignore) : emptyDirState
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
      path: path.resolve(specificOrigin.path, resource),
      origin: originUsed
    }

    // if a non-directory,
    // or from src dir,
    // then it's terminal
    if (originUsed === 'src' || !stats.isDirectory()) {
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
    result[resource] = await walk({
      path: srcHasResourceDir ? path.resolve(src.path, resource) : null,
      root: src.root,
      ignore: src.ignore
    }, {
      path: path.resolve(apply.path, resource),
      root: apply.root,
      ignore: apply.ignore
    })
  }

  return result
}

const logPrefixes = helpers.equalWidths(['src', 'apply']).reduce((lookup, string) => {
  const trimmed = string.trim()
  string = trimmed === 'src' ? helpers.green(string) : helpers.blue(string)
  string = helpers.bold(string)
  lookup[trimmed] = string
  return lookup
}, {})

async function generateDest(tree, dest) {
  for (const resource in tree) {
    const node = tree[resource]
    const destPath = path.resolve(dest, resource)

    if (!(node instanceof TerminalResource)) {
      if (!dryRun) {
        await mkdir(destPath) // todo: ensure same mode used
      }
      generateDest(node, destPath)
      continue
    }

    const isSymbolicLink = node.stats.isSymbolicLink()
    const isDirectory = !isSymbolicLink && node.stats.isDirectory()

    console.log(`${logPrefixes[node.origin]} --> ${destPath}${isDirectory ? '/' + helpers.underline('*') : ''}`)

    if (dryRun) {
      continue
    }

    if (isSymbolicLink) {
      await copy(node.path, destPath)
      continue
    }

    symlink(node.path, destPath)
  }
}

function dir(dirPath, dirRoot, ignore) {
  return new Promise((resolve, reject) => {
    // would like to use withFileTypes but it's not avail until node v10.10.0
    fs.readdir(dirPath, {
      encoding: 'utf8',
      withFileTypes: true
    }, async (err, list) => {
      if (err) {
        return reject(err)
      }

      let relativePath = path.relative(dirRoot, dirPath)
      relativePath += relativePath.length ? '/' : ''

      // get all file stats
      // { 'config.yml': <fs.Stats> }
      const eachResult = await Promise.all(list.map(resource => stat(dirPath, resource)))

      const ignoreIndex = list.indexOf('.augignore')
      if (ignoreIndex > -1) {
        const ignoreContent = (await readFile(path.resolve(dirPath, '.augignore')))
          .split('\n')
          .reduce((lines, current) => {
            if (/^\s*$/.test(current) || /^\s*#/.test(current)) {
              return lines
            }

            lines.push(relativePath + current)
            return lines 
          }, [])

        ignore.add(ignoreContent)
        list.splice(ignoreIndex, 1)
      }

      list = list.filter(resource => !ignore.ignores(relativePath + resource))

      resolve({
        path: dirPath,
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

function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, content) => {
      if (err) {
        return reject(err)
      }
      resolve(content)
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

function symlink(originPath, destPath) {
  return new Promise((resolve, reject) => {
    fs.symlink(originPath, destPath, err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

function mkdir(path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, err => {
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
