export async function onRequest(context) {
  const request = context.request;
  const requestClone = new Request(request);
  requestClone.headers.delete('cookie');
  requestClone.headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP'));
  console.log(requestClone.headers);
  return fetch('https://plausible.drs.software/api/event', requestClone);
}
