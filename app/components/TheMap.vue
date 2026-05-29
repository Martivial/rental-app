<template>
  <div class="w-full h-full p-4 bg-slate-50">
    <div id="map-container" class="w-full h-full rounded-[2rem] shadow-inner overflow-hidden border-8 border-white"></div>
  </div>
</template>
<script setup>
import { onMounted, watch } from 'vue'

const props = defineProps(['items', 'center'])
const emit = defineEmits(['map-click'])

onMounted(async () => {
  const L = await import('leaflet')
 
  await import('leaflet/dist/leaflet.css')

  const startLat = props.center?.lat || 52.23
  const startLng = props.center?.lng || 21.01
  const startZoom = props.center ? 15 : 13

  const map = L.map('map-container', {
    zoomControl: false,
    attributionControl: false
  }).setView([startLat, startLng], startZoom)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20
  }).addTo(map)

  // Grupa na ogłoszenia sąsiadów
  const markerGroup = L.layerGroup().addTo(map)
  
  // POPRAWKA 1: Tworzymy osobną grupę tylko na marker użytkownika "Tu jesteś"
  const userLocationGroup = L.layerGroup().addTo(map)

  // LOGIKA RYSOWANIA PINEZEK SĄSIADÓW
  const drawMarkers = () => {
    markerGroup.clearLayers()
    props.items?.forEach(item => {
      if (item.lat && item.lng) {
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

        L.marker([item.lat, item.lng], { icon: customIcon })
          .addTo(markerGroup)
          .bindPopup(`<b>${item.name}</b>`)
      }
    })
  }

  // POPRAWKA 2: Nowa funkcja, która rysuje niebieskiego ludzika na mapie
  const drawUserMarker = (coords) => {
    userLocationGroup.clearLayers() // Czyścimy poprzednią pozycję ludzika

    if (!coords || !coords.lat || !coords.lng) return

    // Tworzymy ikonę niebieskiego ludzika z napisem "Tu jesteś" za pomocą Tailwinda
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
      iconAnchor: [50, 65] // Kotwica ustawiona tak, by dymek stał dokładnie na punkcie GPS
    })

    // Stawiamy ludzika na mapie
    L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(userLocationGroup)
  }

  // Rysujemy wszystko na starcie
  drawMarkers()
  drawUserMarker(props.center) // Próba narysowania ludzika, jeśli od razu mamy GPS
  
  watch(() => props.items, () => {
    drawMarkers()
  }, { deep: true })

  // POPRAWKA 3: Aktualizujemy strażnika (watch). 
  // Gdy GPS namierzy pozycję, nie tylko przesuwamy kamerę (flyTo), ale też rysujemy ludzika!
  watch(() => props.center, (newCenter) => {
    if (newCenter && newCenter.lat && newCenter.lng) {
      // 1. Rysujemy ludzika w nowym miejscu
      drawUserMarker(newCenter)
      
      // 2. Lecimy tam kamerą
      map.flyTo([newCenter.lat, newCenter.lng], 15, {
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