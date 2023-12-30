# emoji.json [![npm](https://img.shields.io/npm/v/emoji.json.svg?style=flat-square)](https://www.npmjs.com/package/emoji.json)

Just an emoji.json.

Generated from [emoji-test.txt](https://unicode.org/Public/emoji/15.1/emoji-test.txt) with [this script](scripts/gen.js).

> NOTE: There are no Emoji versions 6.0-10.0 as a decision was made in 2017 to align emoji version numbers with their respective Unicode versions starting with version 11.0.

### Usage

**install with npm**

`npm install emoji.json` then:

```javascript
var emoji = require('emoji.json')
console.log(emoji[2])
// {
//   codes: '1F604',
//   char: '😄',
//   name: 'grinning face with smiling eyes',
//   category: 'Smileys & Emotion'
// }
```

use i18n

```javascript
var emoji = require('emoji.json')
var emoji_i18n = require('emoji.json/i18n/de.json') // Import German with "de.json"
console.log(emoji_i18n[emoji[2].char]) // Get i18n with char as key
// {
//   "name": "grinsendes Gesicht mit lachenden Augen",
//   "keywords": ["Gesicht", "grinsendes Gesicht mit lachenden Augen", "lol", "lustig"]
// }
```

if you care about file size:

```javascript
var emojiCompact = require('emoji.json/emoji-compact.json')
console.log(emojiCompact)
// ["😀","😁","😂","🤣" ...]
```

**fetch from web**

- https://unpkg.com/emoji.json/emoji.json
- https://unpkg.com/emoji.json/emoji-compact.json
