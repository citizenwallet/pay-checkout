export const getCidFromUri = (uri: string) => {
  if (uri.startsWith('ipfs://')) {
    return uri.split('/')[2];
  }
  if (uri.startsWith('https://')) {
    return uri.split('/')[3];
  }
  return uri;
};
