import MediumError from "./MediumError.js"
import graphqlQuery from './graphqlQuery.js'
import graphqlQueryMin from './graphqlQueryMin.js'

const DEFAULT_ERROR_CODE = -1
const DEFAULT_TIMEOUT_MS = 5000
const PAGE_LIMIT = 25

export default class MediumClient {

  _accessToken = null

  /**
   * Sets an access token on the client used for making requests.
   */
  constructor(
    accessToken
  ) {
    this._accessToken = accessToken
  }

  /**
   * Returns the details of the user associated with the current
   * access token.
   *
   * Requires the current access token to have the basicProfile scope.
   */
  async getUser() {
    return this._makeRequest({
      method: 'GET',
      path: '/v1/me',
    });
  }

  /**
   * Returns the publications related to the current user.
   *
   * Requires the current access token to have the
   * listPublications scope.
   */
  async getPublicationsForUser(options) {
    this._enforce(options, ['userId']);
    return this._makeRequest({
      method: 'GET',
      path: `/v1/users/${options.userId}/publications`,
    })
  }

  /**
   * Returns the contributors for a chosen publication.
   *
   * Requires the current access token to have the basicProfile scope.
   */
  async getContributorsForPublication(options) {
    this._enforce(options, ['publicationId']);
    return this._makeRequest({
      method: 'GET',
      path: `/v1/publications/${options.publicationId}/contributors`,
    })
  }

  /**
   * Creates a post on Medium.
   *
   * Requires the current access token to have the publishPost scope.
   */
  async createPost({
    title,
    content,
    userId,
    tags,
    canonicalUrl,
    license = "all-rights-reserved",
    publishedAt,
    publishStatus = "draft",
    contentFormat = "markdown",
  }) {
    // If `user id` is not provided, use the current user.
    if (!userId) ({ id: userId } = await this.getUser())

    return await this._createPost({
      canonicalUrl,
      content,
      contentFormat,
      license,
      publishedAt,
      publishStatus,
      tags,
      title,
      userId,
    })
  }

  /**
   * Creates a post on Medium.
   *
   * Requires the current access token to have the publishPost scope.
   */
  async _createPost(
    options
  ) {
    this._enforce(options, ['userId'])

    return this._makeRequest({
      method: 'POST',
      path: `/v1/users/${options.userId}/posts`,
      data: {
        canonicalUrl: options.canonicalUrl,
        content: options.content,
        contentFormat: options.contentFormat,
        license: options.license,
        publishedAt: options.publishedAt,
        publishStatus: options.publishStatus,
        tags: options.tags,
        title: options.title,
      },
    })
  }

  /**
   * Creates a post on Medium and places it under the specified publication.
   *
   * Requires the current access token to have the publishPost scope.
   */
  async createPostInPublication(options) {
    this._enforce(options, ['publicationId'])

    return this._makeRequest({
      method: 'POST',
      path: `/v1/publications/${options.publicationId}/posts`,
      data: {
        title: options.title,
        content: options.content,
        contentFormat: options.contentFormat,
        tags: options.tags,
        canonicalUrl: options.canonicalUrl,
        publishedAt: options.publishedAt,
        publishStatus: options.publishStatus,
        license: options.license,
      },
    })
  }

  /**
   * Enforces that the given options object (first param) defines
   * all keys requested (second param). Raises an error if any
   * is missing.
   */
  _enforce(options, requiredKeys) {
    if (!options) {
      throw new MediumError(
        'Parameters for this call are undefined',
        DEFAULT_ERROR_CODE
      )
    }
    requiredKeys.forEach((requiredKey) => {
      if (!options[requiredKey])
        throw new MediumError(
          `Missing required parameter "${requiredKey}"`,
          DEFAULT_ERROR_CODE
        )
    })
  }

  /**
   * Makes a request to the Medium API.
   */
  async _makeRequest(options) {
    const requestParams = {
      method: options.method,
      headers: {
        'Content-Type':
          options.contentType || 'application/json',
        Authorization: `Bearer ${this._accessToken}`,
        Accept: 'application/json',
        'Accept-Charset': 'utf-8',
      },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    }

    if (options.data) {
      requestParams.body = JSON.stringify(options.data)
    }

    try {
      const response = await fetch(
        `https://api.medium.com${options.path}`,
        requestParams
      )

      const payload = await response.json()

      const statusType = Math.floor(response.status / 100)

      if (statusType === 4 || statusType === 5) {
        const err = payload.errors[0]
        throw new MediumError(err.message, err.code)
      } else if (statusType === 2) {
        return payload.data || payload
      } else {
        throw new MediumError(
          'Unexpected response',
          DEFAULT_ERROR_CODE
        );
      }
    } catch (err) {
      console.log(`Error: ${err}`)
      throw new MediumError(err.toString(), DEFAULT_ERROR_CODE)
    }
  }

  /**
   * Retrieve the published posts
   * under a Medium username.
   *
   * For example, given a profile URL at:
   *   https://medium.com/@my-user
   *
   * Username can be either `@my-user` or `my-user` (in this example).
   *
   * @param username Medium user to retrieve published posts for.
   */
  async getPosts(username) {
    let next = 0,
      allPosts = [],
      posts

    while (next != null) {
      ({ posts, next } = await this._getPosts(username, next))
      allPosts.push(...posts)
    }

    return allPosts
  }

  /**
   * Retrieve the **titles** of published posts
   * under a Medium username.
   *
   * For example, given a profile URL at:
   *   https://medium.com/@my-user
   *
   * Username can be either `@my-user` or `my-user` (in this example).
   *
   * @param username Medium user to retrieve published posts for.
   */
  async getPostTitles(username) {
    let next = 0,
      allPosts = [],
      posts

    while (next != null) {
      ({ posts, next } = await this._getPostTitles(
        username,
        next
      ))
      allPosts.push(...posts)
    }

    return allPosts
  }

  async _getPosts(username, page) {
    let graphqlBody = {
      operationName: 'UserStreamOverview',
      query: graphqlQuery,
      variables: {
        userId: username,
        pagingOptions: {
          limit: PAGE_LIMIT,
          page: null,
          source: null,
          to: page ? String(page) : String(Date.now()),
          ignoredIds: null,
        },
      },
    }

    let resp = await fetch('https://medium.com/_/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlBody),
    })

    // NOTE: strip non-post items and strip description fields
    let resp_data = await resp.json()
    let author = resp_data.data.user.name
    // noinspection JSUnresolvedReference
    let posts =
      resp_data.data.user.profileStreamConnection.stream
        .map((stream) => {
          // noinspection JSUnresolvedReference
          return stream.itemType.post;
        })
        .map((post) => {
          // noinspection JSUnresolvedReference
          return {
            id: post.id,
            title: post.title,
            link: post.mediumUrl,
            pubDate: post.firstPublishedAt,
            categories: post.tags.map(
              (tag_obj) => tag_obj.id
            ),
          }
        })

    // noinspection JSUnresolvedReference
    const next =
      posts.length === PAGE_LIMIT
        ? resp_data.data.user.profileStreamConnection
          .pagingInfo.next.to
        : null;

    return {
      author,
      posts,
      next,
    }
  }

  async _getPostTitles(username, page) {
    let graphqlBody = {
      operationName: 'UserStreamOverview',
      query: graphqlQueryMin,
      variables: {
        userId: username,
        pagingOptions: {
          limit: PAGE_LIMIT,
          to: page ? String(page) : String(Date.now()),
        },
      },
    }

    let resp = await fetch('https://medium.com/_/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlBody),
    })

    // NOTE: strip non-post items and strip description fields
    let resp_data = await resp.json();
    // noinspection JSUnresolvedReference
    let posts =
      resp_data.data.user.profileStreamConnection.stream
        .map((stream) => {
          // noinspection JSUnresolvedReference
          return stream.itemType.post;
        })
        .map((post) => {
          return post.title
        })

    // noinspection JSUnresolvedReference
    const next =
      posts.length === PAGE_LIMIT
        ? resp_data.data.user.profileStreamConnection
          .pagingInfo.next.to
        : null

    return {
      posts,
      next,
    }
  }
}

