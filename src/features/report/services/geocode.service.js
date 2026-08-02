// helper gabung komponen alamat
function buildFormattedAddress(parts) {
  const uniqueParts = []
  parts.forEach((part) => {
    if (part && typeof part === "string") {
      const trimmed = part.trim()
      if (trimmed && !uniqueParts.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
        uniqueParts.push(trimmed)
      }
    }
  })
  return uniqueParts.join(", ")
}

// parsing response geocode proxy
function parseProxyGeocode(data) {
  if (!data?.address) return null

  const addr = data.address

  let block = ""
  const allTextForBlock = `${addr.road || ""} ${addr.residential || ""} ${addr.neighbourhood || ""}`
  const blockMatch = allTextForBlock.match(/Blok\s+[A-Za-z0-9]+/i)
  if (blockMatch) {
    block = blockMatch[0]
  }

  let building = ""
  const streetStr = addr.road || addr.pedestrian || addr.path || addr.street || ""
  if (data.name) {
    const nameLower = data.name.toLowerCase().trim()
    const isStreet = [addr.road, addr.pedestrian, addr.path, addr.street].some(
      (s) => s && s.toLowerCase().trim() === nameLower
    )
    const isRes = [addr.residential, addr.neighbourhood].some(
      (r) => r && r.toLowerCase().trim() === nameLower
    )
    const isRegion = [
      addr.suburb,
      addr.village,
      addr.town,
      addr.city,
      addr.county,
      addr.state,
      addr.country,
    ].some((r) => r && r.toLowerCase().trim() === nameLower)

    if (!isStreet && !isRes && !isRegion && nameLower !== "indonesia") {
      building = data.name.trim()
    }
  }

  const details = {
    building,
    street: streetStr,
    houseNumber: addr.house_number || "",
    block,
    residential: addr.residential || addr.neighbourhood || "",
    village: addr.suburb || addr.village || "",
    district: addr.city_district || addr.district || "",
    city: addr.city || addr.town || addr.municipality || "",
    province: addr.state || "",
  }

  let streetWithDetails = streetStr
  if (block && !streetStr.toLowerCase().includes(block.toLowerCase())) {
    streetWithDetails += ` ${block}`
  }
  if (addr.house_number && !streetStr.toLowerCase().includes(addr.house_number.toLowerCase())) {
    streetWithDetails += ` No. ${addr.house_number}`
  }

  const location =
    buildFormattedAddress([
      building,
      streetWithDetails,
      addr.residential,
      addr.neighbourhood,
      addr.suburb || addr.village,
      addr.city_district || addr.district,
      addr.city || addr.town || addr.municipality,
      addr.state,
    ]) || data.display_name || ""

  return { location, details }
}

// parsing response mapbox v6
function parseMapboxV6Geocode(data) {
  if (!data?.features?.length) return null

  const streetFeature = data.features.find(
    (f) =>
      f.properties.feature_type === "address" ||
      f.properties.feature_type === "poi" ||
      f.properties.feature_type === "street"
  )

  let building = ""
  let street = ""
  let houseNumber = ""
  let block = ""

  if (streetFeature) {
    const ctx = streetFeature.properties.context || {}
    if (streetFeature.properties.feature_type === "poi") {
      building = streetFeature.properties.name || ""
      street = ctx.street?.name || ""
    } else {
      street = ctx.street?.name || streetFeature.properties.name || ""
    }
    houseNumber = ctx.address?.address_number || ""
  }

  const findPropName = (type) =>
    data.features.find((f) => f.properties.feature_type === type)?.properties.name || ""

  const residential = findPropName("neighborhood")
  const village = findPropName("locality")
  const district = findPropName("district")
  const city = findPropName("place")
  const province = findPropName("region")

  const blockMatch = street.match(/Blok\s+[A-Za-z0-9]+/i)
  if (blockMatch) {
    block = blockMatch[0]
  }

  const details = {
    building,
    street,
    houseNumber,
    block,
    residential,
    village,
    district,
    city,
    province,
  }

  let streetWithDetails = street
  if (block && !street.includes(block)) streetWithDetails += ` ${block}`
  if (houseNumber && !street.includes(houseNumber)) streetWithDetails += ` No. ${houseNumber}`

  const location = buildFormattedAddress([
    building,
    streetWithDetails,
    residential,
    village,
    district,
    city,
    province,
  ])

  return { location, details }
}

// parsing response mapbox v5
function parseMapboxV5Geocode(data) {
  if (!data?.features?.length) return null

  const ctxMap = {}
  const addressFeature = data.features.find(
    (f) => f.place_type.includes("address") || f.place_type.includes("poi")
  )

  let street = ""
  let houseNumber = ""
  let block = ""

  if (addressFeature) {
    street = addressFeature.text || ""
    houseNumber = addressFeature.address || ""
    if (addressFeature.context) {
      for (const c of addressFeature.context) {
        const prefix = c.id.split(".")[0]
        if (!ctxMap[prefix]) ctxMap[prefix] = c.text
      }
    }
  }

  for (const feature of data.features) {
    if (feature.context) {
      for (const c of feature.context) {
        const prefix = c.id.split(".")[0]
        if (!ctxMap[prefix]) ctxMap[prefix] = c.text
      }
    }
    if (feature.place_type.includes("neighborhood") && !ctxMap["neighborhood"]) {
      ctxMap["neighborhood"] = feature.text
    }
    if (feature.place_type.includes("locality") && !ctxMap["locality"]) {
      ctxMap["locality"] = feature.text
    }
  }

  const blockMatch = street.match(/Blok\s+[A-Za-z0-9]+/i)
  if (blockMatch) {
    block = blockMatch[0]
  }

  const residential = ctxMap["neighborhood"] || ""
  const village = ctxMap["locality"] || ""
  const district = ctxMap["district"] || ""
  const city = ctxMap["place"] || ""
  const province = ctxMap["region"] || ""

  const details = {
    building: "",
    street,
    houseNumber,
    block,
    residential,
    village,
    district,
    city,
    province,
  }

  let streetWithDetails = street
  if (block && !streetWithDetails.includes(block)) streetWithDetails += ` ${block}`
  if (houseNumber && !streetWithDetails.includes(houseNumber)) streetWithDetails += ` No. ${houseNumber}`

  const location = buildFormattedAddress([
    streetWithDetails,
    residential,
    village,
    district,
    city,
    province,
  ])

  return { location, details }
}

// service reverse geocode multi-tier
export const geocodeService = {
  async reverseGeocodeMultiTier(latitude, longitude) {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
    const result = await this.reverseGeocode(latitude, longitude, mapboxToken)
    return result?.location || ""
  },

  async reverseGeocode(latitude, longitude, mapboxToken) {
    // tier 1: server proxy geocode
    try {
      const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`)
      if (response.ok) {
        const data = await response.json()
        const result = parseProxyGeocode(data)
        if (result?.location) return result
      }
    } catch (err) {
      console.warn("Geocode proxy failed, fallback to mapbox v6", err)
    }

    // tier 2: mapbox geocoding v6
    if (mapboxToken) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${longitude}&latitude=${latitude}&access_token=${mapboxToken}&language=id`
        )
        if (response.ok) {
          const data = await response.json()
          const result = parseMapboxV6Geocode(data)
          if (result?.location) return result
        }
      } catch (err) {
        console.warn("Mapbox v6 failed, fallback to mapbox v5", err)
      }

      // tier 3: mapbox geocoding v5
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&language=id&types=address,poi,neighborhood,locality,place,district,region&limit=5`
        )
        if (response.ok) {
          const data = await response.json()
          const result = parseMapboxV5Geocode(data)
          if (result?.location) return result
        }
      } catch (err) {
        console.warn("Mapbox v5 failed", err)
      }
    }

    return { location: "", details: null }
  },
}
