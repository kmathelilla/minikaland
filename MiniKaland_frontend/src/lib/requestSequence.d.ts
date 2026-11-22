export function createRequestSequence(): {
  begin(): number;
  isLatest(requestId: number): boolean;
};
