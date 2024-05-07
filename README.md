# Medium API

Wrapper for Medium API for
- Gettting a user
- Creating posts
- Getting posts
- Gettting publications

[![npm Package](https://img.shields.io/npm/v/@felwine/medium-api.svg?style=flat-square)](https://www.npmjs.org/package/@felwine/medium-api)
[![NPM Downloads](https://img.shields.io/npm/dm/@felwine/medium-api.svg)](https://npmjs.org/package/@felwine/medium-api)
[![Build Status](https://github.com/clinext-org/sdk/actions/workflows/release.yml/badge.svg)](https://github.com/clinext-org/sdk/actions/tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)


## Install
```bash
yarn add @felwine/medium-api
```

# Use
```js
import {
  MediumClient
} from '@felwine/medium-api'

export default async (payload) => {

  const {
    token,
    title,
    content,
    contentHTML,
    contentFormat = "markdown",
    publishStatus = "draft",
    license = "all-rights-reserved",
    canonicalUrl,
    tags = [],
    notifyFollowers = true
  } = payload

  const client = new MediumClient(token)
  const user = await client.getUser()

  const { id: userId, username } = user

  const post = await client.createPost({
    title,
    content,
    userId,
    contentFormat,   // Defaults to `markdown`
    publishStatus,  // Defaults to `draft`
    tags,
    canonicalUrl,
    license,
  })

  return post
}
```

## License
MIT © [servable-community](https://github.com/servable-community)
