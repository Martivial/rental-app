<template>
  <div class="absolute top-4 left-4 z-[1000] w-72 md:w-96 font-sans">
    <div class="relative">
      <!-- Pasek wyszukiwania w stylu reszty aplikacji -->
      <div class="relative bg-white/95 backdrop-blur-md border border-slate-200/80 hover:border-green-500 focus-within:border-green-600 rounded-2xl shadow-lg flex items-center px-3.5 py-2.5 transition">
        <Search class="text-slate-400 mr-2.5 flex-shrink-0" :size="16" />
        <input 
          v-model="addressQuery" 
          @input="handleAddressInput"
          @keyup.enter="triggerSearch"
          type="text" 
          placeholder="Szukaj adresu lub miejscowości..." 
          class="w-full bg-transparent border-none text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
        />
        <button 
          v-if="addressQuery" 
          @click="clearQuery" 
          class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer text-xs"
        >
          ✕
        </button>
      </div>

      <!-- Dropdown z podpowiedziami -->
      <div 
        v-if="suggestions.length > 0" 
        class="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[1001] max-h-60 overflow-y-auto"
      >
        <div 
          v-for="(place, index) in suggestions" 
          :key="index"
          @click="selectSuggestion(place)"
          class="px-3.5 py-2.5 hover:bg-green-50 text-xs text-slate-700 cursor-pointer border-b border-slate-100 last:border-none flex items-center gap-2 transition"
        >
          <span>📍</span>
          <span class="font-medium truncate">{{ place.display_name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'

const emit = defineEmits(['location-selected'])

const addressQuery = ref('')
const suggestions = ref([])
let searchTimeout = null

async function handleAddressInput() {
  clearTimeout(searchTimeout)
  if (!addressQuery.value || addressQuery.value.length < 3) {
    suggestions.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery.value)}&countrycodes=pl&limit=5`)
      const data = await res.json()
      suggestions.value = data
    } catch (err) {
      console.error('Błąd pobierania podpowiedzi adresów:', err)
    }
  }, 300)
}

function selectSuggestion(place) {
  addressQuery.value = place.display_name
  suggestions.value = []

  const lat = parseFloat(place.lat)
  const lon = parseFloat(place.lon)

  emit('location-selected', { lat, lng: lon, name: place.display_name })
}

async function triggerSearch() {
  if (!addressQuery.value) return
  suggestions.value = []
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery.value)}&countrycodes=pl&limit=1`)
    const data = await res.json()
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lon = parseFloat(data[0].lon)
      emit('location-selected', { lat, lng: lon, name: data[0].display_name })
    } else {
      alert("Nie znaleziono takiego adresu.")
    }
  } catch (err) {
    console.error("Błąd wyszukiwania adresu:", err)
  }
}

function clearQuery() {
  addressQuery.value = ''
  suggestions.value = []
}
</script>