const fs = require('fs')
const path = require('path')
const https = require('https')

const EMOJI_VERSION = '15.1'

main()

async function main () {
  const text = await getTestFile(EMOJI_VERSION)

  console.log(`Format text to json...`)
  const collected = text.trim().split('\n').reduce((accu, line) => {
    if (line.startsWith('# group: ')) {
      console.log(`  Processing ${line.substr(2)}...`)
      accu.group = line.substr(9)
    } else if (line.startsWith('# subgroup: ')) {
      accu.subgroup = line.substr(12)
    } else if (line.startsWith('#')) {
      accu.comments = accu.comments + line + '\n'
    } else {
      const meta = parseLine(line)
      if (meta) {
        meta.category = `${accu.group} (${accu.subgroup})`
        meta.group = accu.group
        meta.subgroup = accu.subgroup
        accu.full.push(meta)
        accu.compact.push(meta.char)
      } else {
        accu.comments = accu.comments.trim() + '\n\n'
      }
    }
    return accu
  }, { comments: '', full: [], compact: [] })

  console.log(`Processed emojis: ${collected.full.length}`)

  const i18n = await getI18n(collected.full)

  console.log('Write file: emoji.json, emoji-compact.json, i18n/xx.json \n')
  await writeFiles(collected, i18n)

  console.log(collected.comments)
}

async function get (url, headers={}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, res => {
      let text = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        process.stdout.write('.')
        text += chunk
      })
      res.on('end', () => {
        process.stdout.write('\n')
        resolve(text)
      })
      res.on('error', reject)
    })
  })
}

async function getTestFile (ver) {
  const url = `https://unicode.org/Public/emoji/${ver}/emoji-test.txt`

  process.stdout.write(`Fetch emoji-test.txt (v${EMOJI_VERSION})`)
  return get(url)
}

async function getI18nList () {
  const url = `https://api.github.com/repos/unicode-org/cldr-json/git/trees/main?recursive=1`

  process.stdout.write(`Get i18n file list`)
  return get(url, {
    'user-agent': 'node.js',
    'X-GitHub-Api-Version': '2022-11-28'
  })
}

async function getI18nData (lang) {
  const url = `https://cdnjs.cloudflare.com/ajax/libs/cldr-json/43.1.0/cldr-annotations-full/annotations/${lang}/annotations.json`

  process.stdout.write(`Get i18n data (${lang})`)
  const dataString = await get(url)
  var result = [];

  try {
    result = JSON.parse(dataString);
  } catch (error) {
    console.log(url)
    console.log(dataString)
    result = {
      "annotations": {
        "annotations": {}
      }
    }
  }

  return result
}

async function getI18n (full) {
  const list = await getI18nList()
  var i18nList = []
  JSON.parse(list).tree.map((item)=>{
    if(item.path.indexOf('cldr-json/cldr-annotations-full/annotations/') === 0 && item.path.indexOf('/annotations.json') > 0){
      i18nList.push(item.path.match(/^cldr-json\/cldr-annotations-full\/annotations\/(\S+)\/annotations.json$/)[1])
    }
  })

  var i18n = [];
  for (let index = 0; index < i18nList.length; index++) {
    const lang = i18nList[index];
    const json = await getI18nData(lang)
    var data = {}

    full.map((emoji)=>{
      if(json?.annotations?.annotations && typeof json.annotations.annotations === 'object' && json.annotations.annotations.hasOwnProperty(emoji.char)){
        const item = json.annotations.annotations[emoji.char]
        data[emoji.char] = {
          name: item?.tts && typeof item.tts === 'object' ? item.tts[0] : '',
          keywords: item.default
        }
      }else{
        data[emoji.char] = {
          name: '',
          keywords: []
        }
      }
    })

    i18n.push({lang, data});
  }

  return i18n
}

function parseLine (line) {
  const data = line.trim().split(/\s+[;#] /)

  if (data.length !== 3) {
    return null
  }

  const [ codes, status, charAndName ] = data
  const [ , char, name ] = charAndName.match(/^(\S+) E\d+\.\d+ (.+)$/)

  return { codes, char, name }
}

const rel = (...args) => path.resolve(__dirname, ...args)

function writeFiles({ full, compact }, i18n) {
  fs.writeFileSync(rel('../emoji.json'), JSON.stringify(full), 'utf8')
  fs.writeFileSync(rel('../emoji-compact.json'), JSON.stringify(compact), 'utf8')
  i18n.map((file)=>{
    fs.writeFileSync(rel(`../i18n/${file.lang}.json`), JSON.stringify(file.data), 'utf8')
  })
}
