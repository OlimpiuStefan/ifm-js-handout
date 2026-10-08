// Loading several devices at once.
//
// fetchReading is passed in, not imported: the page passes a fetch-based
// one, the tests pass a fake. Same code, no server needed.

// Every id is fetched in parallel. One dead sensor is one null; the other
// eleven come back. Results are in the order of `ids`.
export async function loadAll(ids, fetchReading) {
  const settled = await Promise.allSettled(ids.map((id) => fetchReading(id)));
  return settled.map((r) => (r.status === 'fulfilled' ? r.value : null));
}

// `fetcher` defaults to the real fetch; a test hands in a fake.
// fetch does not reject on a 503: `res.ok` is checked here, once.
export const httpReading =
  (baseUrl, { fetcher = fetch } = {}) =>
  async (id) => {
    const res = await fetcher(`${baseUrl}/api/devices/${id}/reading`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) throw new Error(`${res.status} on ${id}`);
    return res.json();
  };
