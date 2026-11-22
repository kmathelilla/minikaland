export function createRequestSequence() {
  let latestRequest = 0;

  return {
    begin() {
      latestRequest += 1;
      return latestRequest;
    },
    isLatest(requestId) {
      return requestId === latestRequest;
    },
  };
}
