// Maps & Nearby Healthcare Module
const router  = require('express').Router();
const axios   = require('axios');
const { authenticate } = require('../../middleware/auth.middleware');

const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

const PLACE_TYPES = {
  all:      ['hospital', 'doctor', 'pharmacy'],
  hospital: ['hospital'],
  phc:      ['doctor'],
  clinic:   ['doctor'],
  pharmacy: ['pharmacy'],
};

router.get('/nearby', authenticate, async (req, res) => {
  const { lat, lng, type = 'all', radius = 5000 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  // Try Google Maps Places API
  if (GMAPS_KEY) {
    try {
      const types   = PLACE_TYPES[type] || PLACE_TYPES.all;
      const results = await Promise.all(
        types.map(t =>
          axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
            params: { location: `${lat},${lng}`, radius, type: t, key: GMAPS_KEY },
            timeout: 6000,
          })
        )
      );

      const places = results
        .flatMap(r => r.data.results || [])
        .map(p => ({
          id:       p.place_id,
          name:     p.name,
          address:  p.vicinity,
          rating:   p.rating,
          open_now: p.opening_hours?.open_now,
          location: p.geometry.location,
          types:    p.types,
        }));

      return res.json({ places, source: 'google_maps' });
    } catch (err) {
      // Fall through to static data
    }
  }

  // Static fallback data for offline / no API key
  res.json({
    places: [
      { id: '1', name: 'District Government Hospital', address: 'Civil Lines, Lucknow',         type: 'hospital',  distance_km: 1.2, phone: '0522-2222111', emergency: true,  open_now: true },
      { id: '2', name: 'PHC Kalyanpur',                address: 'Kalyanpur, Lucknow',            type: 'phc',       distance_km: 2.8, phone: '0522-3332111', emergency: false, open_now: true },
      { id: '3', name: 'Dr. Priya Sharma Clinic',      address: 'Sector 14, Indira Nagar',       type: 'clinic',    distance_km: 0.8, phone: '+91-9876543210', open_now: true  },
      { id: '4', name: 'Medplus Pharmacy',             address: 'Vikas Nagar Road',              type: 'pharmacy',  distance_km: 0.4, phone: '+91-9876500099', open_now: true  },
      { id: '5', name: 'Sanjay Gandhi Hospital',       address: 'Raibareli Road, Lucknow',       type: 'hospital',  distance_km: 4.5, phone: '0522-2257540', emergency: true,  open_now: true },
      { id: '6', name: 'Sub-Centre Rampur',            address: 'Rampur Colony',                 type: 'phc',       distance_km: 3.2, phone: '0522-3001200', open_now: false  },
    ],
    source: 'static_fallback',
  });
});

router.get('/directions', async (req, res) => {
  const { origin_lat, origin_lng, dest_lat, dest_lng, mode = 'driving' } = req.query;
  if (GMAPS_KEY) {
    try {
      const r = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin:      `${origin_lat},${origin_lng}`,
          destination: `${dest_lat},${dest_lng}`,
          mode,
          key: GMAPS_KEY,
        },
        timeout: 6000,
      });
      return res.json(r.data);
    } catch {}
  }
  res.json({ message: 'Google Maps Directions API key required', maps_url: `https://maps.google.com/?q=${dest_lat},${dest_lng}` });
});

router.get('/geocode', async (req, res) => {
  const { address } = req.query;
  if (GMAPS_KEY) {
    try {
      const r = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address, key: GMAPS_KEY },
        timeout: 5000,
      });
      return res.json(r.data.results?.[0] || {});
    } catch {}
  }
  res.json({ error: 'Geocoding unavailable' });
});

module.exports = router;
