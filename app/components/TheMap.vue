<template>
  <div class="w-full h-full p-4 bg-slate-50 relative">
    <div id="map-container" class="w-full h-full rounded-[2rem] shadow-inner overflow-hidden border-8 border-white"></div>
  </div>
</template>

<script setup>
import { onMounted, watch, nextTick } from 'vue'

const props = defineProps(['items', 'center', 'searchedLocation'])
const emit = defineEmits(['map-click', 'marker-click'])

// Bezpieczna i szybka generacja kodu SVG dla ikon Lucide bezpośrednio w przeglądarce
const getHammerIconSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414L12 9"/><path d="m18 15 4-4"/><path d="M21.5 11.5 19 9l-1.5 1.5"/><path d="M9 12 12 9"/><path d="M11 4 7.5 7.5"/><path d="M14.5 4.5 18 8"/><path d="M12 2 4.5 9.5"/></svg>`

const getUserIconSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`

const getMapPinIconSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`

onMounted(async () => {
  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  const startLat = props.center?.lat || 52.23
  const startLng = props.center?.lng || 21.01
  const startZoom = props.center ? 13 : 13

  const map = L.map('map-container', {
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true
  }).setView([startLat, startLng], startZoom)

  L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_339b_1_99d5060c2db4d7afe18a7c55', {
    maxZoom: 20
  }).addTo(map)

  setTimeout(() => {
    map.invalidateSize()
  }, 200)

  const markerGroup = L.layerGroup().addTo(map)
  const userLocationGroup = L.layerGroup().addTo(map)
  const searchedLocationGroup = L.layerGroup().addTo(map)

  // 1. Rysowanie markerów ogłoszeń
  const drawMarkers = () => {
    markerGroup.clearLayers()
    if (!props.items || props.items.length === 0) return

    props.items.forEach(item => {
      const lat = Number(item.lat)
      const lng = Number(item.lng)

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="flex flex-col items-center">
              <div class="bg-green-600 hover:bg-green-700 w-10 h-10 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform">
                ${getHammerIconSvg()}
              </div>
              <div class="bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-lg shadow-md border border-slate-100 text-[10px] font-bold mt-1 text-center whitespace-nowrap text-slate-800">${item.name}</div>
            </div>
          `,
          iconSize: [100, 50],
          iconAnchor: [50, 25]
        })

        L.marker([lat, lng], { icon: customIcon })
          .addTo(markerGroup)
          .on('click', () => emit('marker-click', item))
      }
    })
  }

  // 2. Rysowanie lokalizacji GPS "Tu jesteś"
  const drawUserMarker = (coords) => {
    userLocationGroup.clearLayers()
    if (!coords || !coords.lat || !coords.lng) return

    const userIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="flex flex-col items-center relative">
          <div class="bg-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-md mb-1 uppercase tracking-wider animate-bounce whitespace-nowrap">
            Tu jesteś
          </div>
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-50"></span>
            <div class="bg-blue-600 w-10 h-10 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center text-white z-10">
              ${getUserIconSvg()}
            </div>
          </div>
        </div>
      `,
      iconSize: [100, 70],
      iconAnchor: [50, 65]
    })

    L.marker([Number(coords.lat), Number(coords.lng)], { icon: userIcon }).addTo(userLocationGroup)
  }

  // 3. Rysowanie wyszukanego punktu
  const drawSearchedMarker = (coords) => {
    searchedLocationGroup.clearLayers()
    if (!coords || !coords.lat || !coords.lng) return

    const searchedIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="flex flex-col items-center relative">
          <div class="bg-red-600 w-11 h-11 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center text-white animate-bounce">
            ${getMapPinIconSvg()}
          </div>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    })

    L.marker([Number(coords.lat), Number(coords.lng)], { icon: searchedIcon }).addTo(searchedLocationGroup)
  }

  drawMarkers()
  drawUserMarker(props.center)

  watch(() => props.items, () => {
    nextTick(() => {
      drawMarkers()
      map.invalidateSize()
    })
  }, { deep: true, immediate: true })

  watch(() => props.searchedLocation, (newLoc) => {
    if (newLoc && newLoc.lat && newLoc.lng) {
      drawSearchedMarker(newLoc)
      map.flyTo([Number(newLoc.lat), Number(newLoc.lng)], 14, {
        animate: true,
        duration: 1.5
      })
      setTimeout(() => map.invalidateSize(), 1500)
    }
  }, { deep: true })

  watch(() => props.center, (newCenter) => {
    if (newCenter && newCenter.lat && newCenter.lng) {
      drawUserMarker(newCenter)
      searchedLocationGroup.clearLayers()
      map.flyTo([Number(newCenter.lat), Number(newCenter.lng)], 15, {
        animate: true,
        duration: 1.5
      })
    }
  }, { deep: true })

  map.on('click', (e) => {
    emit('map-click', { lat: e.latlng.lat, lng: e.latlng.lng })
  })

  L.control.zoom({ position: 'topright' }).addTo(map)
})
</script>

<style>
.leaflet-container {
  background: #f8fafc !important;
}
.custom-div-icon {
  background: none !important;
  border: none !important;
}
</style>