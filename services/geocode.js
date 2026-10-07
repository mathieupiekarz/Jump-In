const geoCache = {};

// permet de retourner les coordonnées d'un ville
async function geocode(ville) {
  // cache mémoire des villes pour + de rapidité, pas d'appel réseau
  if (geoCache[ville]) return geoCache[ville];
  // on interroge l'api Nominatim en mode search
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    ville
  )}`;
  const res = await fetch(url, { headers: { "User-Agent": "JumpIn-App" } });
  const data = await res.json();
  if (!data[0]) throw new Error(`Ville non trouvée: ${ville}`);
  // format : { latitude, longitude }
  const coord = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  geoCache[ville] = coord;
  return coord;
}

module.exports = { geocode };
