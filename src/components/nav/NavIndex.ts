import { fetchJSON } from '../../lib/fetchJSON';

export async function loadNav(navPath = '/data/navigation.json') {
  return fetchJSON(navPath);
}
