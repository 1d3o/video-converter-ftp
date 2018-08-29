const fs = require('fs')
const rimraf = require('rimraf')
const converter = require('video-converter')
const Client = require('ftp')

// Options
const ftpHost = '#'
const ftpUser = '#'
const ftpPassword = '#'
const ftpPort = '21'
const ftpDir = '#'

// Connection
const c = new Client()

/**
 * @function initializeSystem
 */
function initializeSystem() {
  return new Promise((resolve, reject) => {
    converter.setFfmpegPath('./ffmpeg', function(err) {
      if (err) {
        reject(err)
        return
      }

      rimraf('./tmp', () => {
        fs.mkdirSync('./tmp')
        resolve()
      })
    })
  })
}

/**
 * @function manageFile
 * @param {*} file 
 */
function manageFile(file) {
  return new Promise((resolve, reject) => {
    if (file.type === 'd') {
      resolve()
      return
    }

    if (file.name.includes('.flv')) {
      c.get(`${ftpDir}/${file.name}`, (err, stream) => {
        if (err) {
          reject(err)
          return
        }

        stream.once('close', () => {
          converter.convert(`./tmp/${file.name}`, `./tmp/${file.name}.mp4`, function (err) {
            if (err) {
              reject(err)
              return
            }

            c.put(`./tmp/${file.name}.mp4`, `${ftpDir}/${file.name}.mp4`, function(err) {
              if (err) {
                reject(err)
                return
              }

              resolve()
            })
          })
        })
        stream.pipe(fs.createWriteStream(`./tmp/${file.name}`))
      })
    }
  })
}

c.on('ready', () => {
  c.list(ftpDir, (err, list) => {
    if (err) throw err

    initializeSystem()
    .then(() => {
      return Promise.all(list.map((file) => manageFile(file)))
    })
    .then(() => {
      c.end()
      console.log('Operation completed!')
    })
    .catch((err) => {
      c.end()
      throw err
    })
  })
})

c.connect({
  host: ftpHost,
  port: ftpPort,
  user: ftpUser,
  password: ftpPassword
})
