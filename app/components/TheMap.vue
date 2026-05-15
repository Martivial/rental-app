<template>
  <div class="w-full h-full p-4 bg-slate-50">
    <div id="map-container" class="w-full h-full rounded-[2rem] shadow-inner overflow-hidden border-8 border-white"></div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue' // 1. Dodaj watch

const props = defineProps(['items'])
const emit = defineEmits(['map-click'])

onMounted(async () => {
  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  const map = L.map('map-container', {
    zoomControl: false,
    attributionControl: false
  }).setView([52.23, 21.01], 13)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20
  }).addTo(map)

  // 2. Stwórz grupę na markery, żeby móc ją czyścić przy odświeżaniu
  const markerGroup = L.layerGroup().addTo(map)

  // 3. Zamknij logikę rysowania w funkcji
  const drawMarkers = () => {
    markerGroup.clearLayers() // Czyści stare, żeby się nie dublowały
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
          iconSize: [100, 50], // Powiększone, żeby tekst się mieścił
          iconAnchor: [50, 25]
        })

        L.marker([item.lat, item.lng], { icon: customIcon })
          .addTo(markerGroup)
          .bindPopup(`<b>${item.name}</b>`)
      }
    })
  }

  // 4. Uruchom rysowanie na starcie i ustaw "strażnika" danych
  drawMarkers()
  
  watch(() => props.items, () => {
    drawMarkers()
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