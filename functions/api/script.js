export async function onRequest({ request, waitUntil }) {
  let response = await caches.default.match(request);
  if (!response) {
    response = await fetch(
      "https://plausible.drs.software/js/script.js",
    );
    waitUntil(caches.default.put(request, response.clone()));
  }
  return response;
}
