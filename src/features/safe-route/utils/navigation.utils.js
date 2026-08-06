/**
 * Navigation utilities for safe-route turn-by-turn simulation
 */

export function haversineDistance(a, b) {
  if (!a || !b || a.length < 2 || b.length < 2) return 0
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(b[1] - a[1])
  const dLon = toRad(b[0] - a[0])
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

export function calculateBearing(a, b) {
  if (!a || !b || a.length < 2 || b.length < 2) return 0
  const toRad = (d) => (d * Math.PI) / 180
  const dLon = toRad(b[0] - a[0])
  const y = Math.sin(dLon) * Math.cos(toRad(b[1]))
  const x =
    Math.cos(toRad(a[1])) * Math.sin(toRad(b[1])) -
    Math.sin(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.cos(dLon)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export function bearingDifference(b1, b2) {
  return ((b2 - b1 + 540) % 360) - 180
}

export function getTurnInstruction(diff) {
  const abs = Math.abs(diff)
  if (abs <= 15) {
    return { type: "straight", label: "Jalan lurus ke depan", icon: "⇱", color: "bg-sky-500/15 text-sky-600" }
  }
  if (abs <= 45) {
    return diff > 0
      ? { type: "slight-right", label: "Belok sedikit kanan", icon: "↱", color: "bg-amber-500/15 text-amber-600" }
      : { type: "slight-left", label: "Belok sedikit kiri", icon: "↰", color: "bg-amber-500/15 text-amber-600" }
  }
  if (abs <= 100) {
    return diff > 0
      ? { type: "right", label: "Belok kanan", icon: "↱", color: "bg-amber-500/15 text-amber-600" }
      : { type: "left", label: "Belok kiri", icon: "↰", color: "bg-sky-500/15 text-sky-600" }
  }
  if (abs <= 150) {
    return diff > 0
      ? { type: "sharp-right", label: "Belok tajam kanan", icon: "⤉", color: "bg-amber-500/15 text-amber-600" }
      : { type: "sharp-left", label: "Belok tajam kiri", icon: "⤊", color: "bg-sky-500/15 text-sky-600" }
  }
  return { type: "u-turn", label: "Putar balik", icon: "⮄", color: "bg-rose-500/15 text-rose-600" }
}

export function calculateTotalDistance(coordinates) {
  if (!coordinates || coordinates.length < 2) return 0
  let total = 0
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineDistance(coordinates[i - 1], coordinates[i])
  }
  return total
}

export function interpolatePosition(coordinates, fraction) {
  if (!coordinates || coordinates.length < 2) return coordinates?.[0] || null
  const f = Math.max(0, Math.min(1, fraction))
  const totalLength = calculateTotalDistance(coordinates)
  if (totalLength === 0) return coordinates[0]

  const targetDist = totalLength * f
  let accumulated = 0

  for (let i = 1; i < coordinates.length; i++) {
    const segLen = haversineDistance(coordinates[i - 1], coordinates[i])
    if (accumulated + segLen >= targetDist) {
      const segFrac = segLen > 0 ? (targetDist - accumulated) / segLen : 0
      return [
        coordinates[i - 1][0] + (coordinates[i][0] - coordinates[i - 1][0]) * segFrac,
        coordinates[i - 1][1] + (coordinates[i][1] - coordinates[i - 1][1]) * segFrac,
      ]
    }
    accumulated += segLen
  }
  return coordinates[coordinates.length - 1]
}

export function findSafePointsNearRoute(coordinates, safePoints, thresholdMeters = 150) {
  if (!coordinates || !safePoints || safePoints.length === 0) return []

  return safePoints
    .map((sp) => {
      let minDist = Infinity
      let nearestCoordIdx = 0
      for (let i = 0; i < coordinates.length; i++) {
        const dist = haversineDistance(coordinates[i], sp.coordinates)
        if (dist < minDist) {
          minDist = dist
          nearestCoordIdx = i
        }
      }
      let distAlong = 0
      for (let i = 1; i <= nearestCoordIdx && i < coordinates.length; i++) {
        distAlong += haversineDistance(coordinates[i - 1], coordinates[i])
      }
      return { ...sp, distanceFromRoute: minDist, nearestCoordIdx, distanceAlongRoute: distAlong }
    })
    .filter((sp) => sp.distanceFromRoute <= thresholdMeters)
    .sort((a, b) => a.nearestCoordIdx - b.nearestCoordIdx)
}

export function formatNavDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}

export function generateNavigationSteps(coordinates, safePoints = []) {
  if (!coordinates || coordinates.length < 3) return []

  const steps = []
  let accDist = 0
  const coords = coordinates
  const MIN_TURN_DIST = 30
  const totalDist = calculateTotalDistance(coords)
  const routeSafePoints = findSafePointsNearRoute(coords, safePoints)
  let nextSafePointIdx = 0

  steps.push({
    id: "start",
    type: "start",
    label: "Mulai dari titik awal",
    distance: totalDist,
    icon: "→",
    color: "bg-primary/15 text-primary",
    fraction: 0,
    isSafePoint: false,
  })

  let currentDist = 0

  for (let i = 1; i < coords.length - 1; i++) {
    const segDist = haversineDistance(coords[i - 1], coords[i])
    currentDist += segDist
    accDist += segDist

    while (
      nextSafePointIdx < routeSafePoints.length &&
      routeSafePoints[nextSafePointIdx].distanceAlongRoute <= currentDist
    ) {
      const sp = routeSafePoints[nextSafePointIdx]
      steps.push({
        id: `safepoint-${sp.id}`,
        type: "safepoint",
        label: sp.name,
        subtitle: sp.categoryLabel,
        distance: totalDist - currentDist,
        icon: "🛡️",
        color: "bg-emerald-500/15 text-emerald-600",
        fraction: currentDist / totalDist,
        isSafePoint: true,
        safePointData: sp,
      })
      nextSafePointIdx++
    }

    if (accDist >= MIN_TURN_DIST) {
      const b1 = calculateBearing(coords[i - 1], coords[i])
      const b2 = calculateBearing(coords[i], coords[i + 1])
      const diff = bearingDifference(b1, b2)

      if (Math.abs(diff) > 20) {
        const turn = getTurnInstruction(diff)
        steps.push({
          id: `step-${i}`,
          type: turn.type,
          label: turn.label,
          distance: totalDist - currentDist,
          icon: turn.icon,
          color: turn.color,
          fraction: currentDist / totalDist,
          isSafePoint: false,
        })
        accDist = 0
      }
    }
  }

  const lastSeg = haversineDistance(coords[coords.length - 2], coords[coords.length - 1])
  currentDist += lastSeg
  steps.push({
    id: "destination",
    type: "destination",
    label: "Tiba di tujuan",
    distance: 0,
    icon: "◉",
    color: "bg-emerald-500/15 text-emerald-600",
    fraction: 1,
    isSafePoint: false,
  })

  return steps
}
