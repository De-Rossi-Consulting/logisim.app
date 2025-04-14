export async function onRequest(context) {
  const request = context.request;
  let response = await caches.default.match(request);
  if (!response) {
    response = await fetch(
      "https://plausible.drs.software/js/script.js",
    );
    ctx.waitUntil(caches.default.put(request, response.clone()));
  }
  return response;
}
