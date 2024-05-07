
export default `
              query UserStreamOverview($userId: ID!, $pagingOptions: PagingOptions) {
                user(username: $userId) {
                name
    profileStreamConnection(paging: $pagingOptions) {
                ...commonStreamConnection
      __typename
    }
              __typename
  }
}
              fragment commonStreamConnection on StreamConnection {
                pagingInfo {
                next {
                limit
      page
              source
              to
              ignoredIds
              __typename
    }
              __typename
  }
              stream {
                ...StreamItemList_streamItem
    __typename
  }
              __typename
}
              fragment StreamItemList_streamItem on StreamItem {
                ...StreamItem_streamItem
  __typename
}
              fragment StreamItem_streamItem on StreamItem {
                itemType {
                __typename
    ... on StreamItemPostPreview {
                post {
                id
            mediumUrl
              title
              firstPublishedAt
              tags {
                id
              }
              __typename
        }
              __typename
    }
  }
              __typename
}
              `
