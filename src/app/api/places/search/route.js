import { NextResponse } from "next/server"

// mapping kategori tempat ke label bahasa indonesia
function mapCategoryToLabel(cat) {
  if (!cat) return "Lokasi"
  const c = String(cat).toLowerCase()
  if (c.includes("station") || c.includes("stasiun") || c.includes("train")) return "Stasiun Kereta"
  if (c.includes("bus") || c.includes("halte") || c.includes("transit")) return "Halte / Transportasi"
  if (c.includes("mall") || c.includes("shopping") || c.includes("supermarket")) return "Pusat Perbelanjaan"
  if (c.includes("hospital") || c.includes("clinic") || c.includes("rumah sakit") || c.includes("rs")) return "Fasilitas Medis"
  if (c.includes("police") || c.includes("polisi") || c.includes("pos polisi")) return "Pos Keamanan"
  if (c.includes("restaurant") || c.includes("cafe") || c.includes("food") || c.includes("makanan")) return "Restoran / Kafe"
  if (c.includes("park") || c.includes("taman")) return "Taman / Area Publik"
  if (c.includes("school") || c.includes("university") || c.includes("kampus")) return "Pendidikan"
  if (c.includes("street") || c.includes("road") || c.includes("jalan") || c.includes("highway")) return "Jalan"
  if (c.includes("building") || c.includes("apart") || c.includes("office") || c.includes("gedung")) return "Gedung / Kantor"
  if (c.includes("neighborhood") || c.includes("village") || c.includes("kelurahan") || c.includes("kecamatan")) return "Kawasan"
  return "Tempat Menarik"
}

// parsing data dari mapbox searchbox
async function fetchMapboxSearchbox(query, token, proximity) {
  const [lon, lat] = proximity.split(",")
  const sessionToken = `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${token}&session_token=${sessionToken}&country=id&proximity=${lon},${lat}&language=id&limit=6`
  
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  const suggestions = data.suggestions || []

  const results = await Promise.all(
    suggestions.slice(0, 4).map(async (s) => {
      let coords = null
      let fullAddress = s.full_address || s.place_formatted || ""
      
      // retrieve koordinat jika ada mapbox_id
      if (s.mapbox_id) {
        try {
          const retUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${s.mapbox_id}?access_token=${token}&session_token=${sessionToken}`
          const retRes = await fetch(retUrl)
          if (retRes.ok) {
            const retData = await retRes.json()
            const feature = retData.features?.[0]
            if (feature?.geometry?.coordinates) {
              coords = feature.geometry.coordinates
            }
          }
        } catch {
          // fallback jika retrieve gagal
        }
      }

      if (!coords) return null

      const category = s.poi_category_ids?.[0] || s.feature_type || "poi"
      return {
        id: `mbx_${s.mapbox_id || Math.random()}`,
        name: s.name,
        address: s.place_formatted || fullAddress || "Indonesia",
        fullAddress: `${s.name}, ${s.place_formatted || fullAddress}`,
        coordinates: coords,
        category,
        categoryLabel: mapCategoryToLabel(category),
        source: "Mapbox",
      }
    })
  )

  return results.filter(Boolean)
}

// parsing data dari openstreetmap photon
async function fetchPhotonOSM(query, proximity) {
  const [lon, lat] = proximity.split(",")
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${lat}&lon=${lon}&limit=6&lang=id`
  
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  const features = data.features || []

  return features
    .map((f) => {
      const p = f.properties || {}
      const name = p.name || p.street || ""
      const coords = f.geometry?.coordinates
      if (!name || !coords || coords.length !== 2) return null

      const parts = [p.street, p.district || p.suburb, p.city || p.county, p.state].filter(
        (part) => part && part.toLowerCase() !== name.toLowerCase()
      )
      const address = parts.join(", ") || p.country || "Indonesia"
      const category = p.osm_value || p.osm_key || "place"

      return {
        id: `osm_${p.osm_id || Math.random()}`,
        name,
        address,
        fullAddress: `${name}, ${address}`,
        coordinates: coords,
        category,
        categoryLabel: mapCategoryToLabel(category),
        source: "OpenStreetMap",
      }
    })
    .filter(Boolean)
}

// parsing data dari openstreetmap nominatim
async function fetchNominatimOSM(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&countrycodes=id&viewbox=106.6,-6.4,107.0,-6.1&bounded=0&limit=5`
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "SafeCommuteApp/1.0 (sistech-safecommute@project.id)",
    },
  })
  if (!res.ok) return []
  const data = await res.json()

  return (data || []).map((item) => {
    const name = item.name || (item.display_name ? item.display_name.split(",")[0] : "Lokasi")
    const coords = [parseFloat(item.lon), parseFloat(item.lat)]
    const addr = item.address || {}
    const parts = [
      addr.road,
      addr.suburb || addr.village,
      addr.city_district || addr.district,
      addr.city || addr.town,
      addr.state,
    ].filter((p) => p && p.toLowerCase() !== name.toLowerCase())
    
    const address = parts.join(", ") || item.display_name || "Indonesia"
    const category = item.type || item.category || "place"

    return {
      id: `nom_${item.place_id || Math.random()}`,
      name,
      address,
      fullAddress: item.display_name || `${name}, ${address}`,
      coordinates: coords,
      category,
      categoryLabel: mapCategoryToLabel(category),
      source: "OpenStreetMap",
    }
  })
}

// handler get pencarian tempat
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()
  const proximity = searchParams.get("proximity") || "106.8272,-6.1754"
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const promises = [
      fetchPhotonOSM(q, proximity).catch(() => []),
      fetchNominatimOSM(q).catch(() => []),
    ]

    if (token) {
      promises.unshift(fetchMapboxSearchbox(q, token, proximity).catch(() => []))
    }

    const responses = await Promise.all(promises)
    const combined = responses.flat()

    // deduplikasi hasil berdasarkan nama & koordinat
    const results = []
    const seen = new Set()

    for (const item of combined) {
      if (!item?.name || !item?.coordinates) continue
      const [lng, lat] = item.coordinates
      const key = `${item.name.toLowerCase().trim()}_${lng.toFixed(2)}_${lat.toFixed(2)}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push(item)
      }
    }

    return NextResponse.json({ results: results.slice(0, 8) })
  } catch (error) {
    console.error("Places search error:", error)
    return NextResponse.json({ error: "Failed to search places" }, { status: 500 })
  }
}
