
export default `
query UserStreamOverview($userId: ID!, $pagingOptions: PagingOptions) {
  user(username: $userId) {
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
to
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
  title
__typename
}
__typename
}
}
__typename
}`
