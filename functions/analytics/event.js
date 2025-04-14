export async function onRequest(context) {
  const request = context.request;
  const requestClone = new Request(request);
  requestClone.headers.delete('cookie');
  return fetch('https://plausible.drs.software/api/event', requestClone);
}
