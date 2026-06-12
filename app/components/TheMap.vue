<template>
  <div class="w-full h-full p-4 bg-slate-50">
    <div id="map-container" class="w-full h-full rounded-[2rem] shadow-inner overflow-hidden border-8 border-white"></div>
  </div>
</template>

<script setup>
import { onMounted, watch, nextTick } from 'vue'

const props = defineProps(['items', 'center'])
// 1. DODAŁEM 'marker-click' DO EMITÓW
const emit = defineEmits(['map-click', 'marker-click'])

onMounted(async () => {
  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  const startLat = props.center?.lat || 52.23
  const startLng = props.center?.lng || 21.01
  const startZoom = props.center ? 15 : 13

  const map = L.map('map-container', {
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true
  }).setView([startLat, startLng], startZoom)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20
  }).addTo(map)

  setTimeout(() => {
    map.invalidateSize()
  }, 200)

  const markerGroup = L.layerGroup().addTo(map)
  const userLocationGroup = L.layerGroup().addTo(map)

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
              <div class="bg-green-600 w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-lg hover:scale-110 transition-transform">
                🛠️
              </div>
              <div class="bg-white px-2 py-0.5 rounded shadow text-[10px] font-bold mt-1 text-center whitespace-nowrap">${item.name}</div>
            </div>
          `,
          iconSize: [100, 50],
          iconAnchor: [50, 25]
        })

        // 2. DODAŁEM OBSŁUGĘ KLIKNIĘCIA W MARKER
        L.marker([lat, lng], { icon: customIcon })
          .addTo(markerGroup)
          .on('click', () => emit('marker-click', item))
      }
    })
  }

  const drawUserMarker = (coords) => {
    userLocationGroup.clearLayers()
    if (!coords || !coords.lat || !coords.lng) return

    const userIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="flex flex-col items-center relative">
          <div class="bg-blue-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-md mb-1 uppercase tracking-wider animate-bounce whitespace-nowrap">
            Tu jesteś
          </div>
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-50"></span>
            <div class="bg-blue-600 w-9 h-9 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-base z-10">
              🧍‍♂️
            </div>
          </div>
        </div>
      `,
      iconSize: [100, 70],
      iconAnchor: [50, 65]
    })

    L.marker([Number(coords.lat), Number(coords.lng)], { icon: userIcon }).addTo(userLocationGroup)
  }

  drawMarkers()
  drawUserMarker(props.center)
  
  watch(() => props.items, () => {
    nextTick(() => {
      drawMarkers()
      map.invalidateSize()
    })
  }, { deep: true, immediate: true })

  watch(() => props.center, (newCenter) => {
    if (newCenter && newCenter.lat && newCenter.lng) {
      drawUserMarker(newCenter)
      map.flyTo([Number(newCenter.lat), Number(newCenter.lng)], 15, {
        animate: true,
        duration: 1.5
      })
      setTimeout(() => map.invalidateSize(), 1500)
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