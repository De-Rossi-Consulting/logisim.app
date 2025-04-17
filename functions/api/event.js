export async function onRequest(context) {
  const request = context.request;
  const requestClone = new Request(request);
  requestClone.headers.delete('cookie');
  requestClone.headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP'));
  return await fetch('https://plausible.drs.software/api/event', requestClone);
}
