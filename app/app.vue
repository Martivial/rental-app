<template>
  <div class="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans">
    
    <header class="h-16 bg-white border-b px-6 flex items-center justify-between z-30 shadow-sm">
      <div class="flex items-center gap-2">
        <div class="bg-green-600 p-1.5 rounded-lg text-white">🛠️</div>
        <h1 class="font-bold text-xl tracking-tight text-slate-800">Sąsiedzka Pożyczalnia</h1>
      </div>
      
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
        <a href="#" class="hover:text-green-600 transition">Przeglądaj</a>
        <a href="#" class="hover:text-green-600 transition">Moje Pożyczenia</a>
        <button class="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition">
          Dodaj Narzędzie
        </button>
      </nav>
    </header>

    <div class="flex-1 flex overflow-hidden">
      
      <aside class="w-96 bg-white border-l shadow-xl z-20 flex flex-col overflow-hidden order-2">
        <div class="p-4 border-b">
          <h2 class="font-bold text-lg text-slate-800">Dostępne Narzędzia w Twojej Okolicy</h2>
          <div class="mt-3 relative">
            <input type="text" placeholder="Szukaj narzędzi..." 
                   class="w-full bg-slate-100 border-none rounded-xl py-2 px-4 pl-10 focus:ring-2 focus:ring-green-500 outline-none text-sm" />
            <span class="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-for="item in items" :key="item.id" 
               class="bg-white border rounded-2xl p-3 shadow-sm hover:shadow-md transition cursor-pointer group border-slate-100">
            <div class="flex gap-4">
              <div class="w-24 h-24 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                <img src="https://via.placeholder.com/150" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-slate-800 group-hover:text-green-600 transition">{{ item.name }}</h3>
                <p class="text-green-600 font-bold text-sm">25 zł/dzień</p>
                <p class="text-xs text-slate-400 mt-1">📍 350m stąd</p>
                <div class="flex items-center justify-between mt-2">
                   <span class="text-xs font-bold text-orange-400">★ 4.9</span>
                   <button class="bg-green-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider">Zarezerwuj</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="flex-1 relative order-1">
        <ClientOnly>
          <TheMap :items="items" @map-click="handleMapClick" />
        </ClientOnly>
        
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-full shadow-lg border border-green-100 flex items-center gap-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
          <span class="text-xs font-bold text-slate-700 font-sans">Twoja lokalizacja</span>
        </div>
      </main>

    </div>

    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center z-[9999] p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h2 class="text-2xl font-bold mb-4">Dodaj nowe ogłoszenie</h2>
        <div class="space-y-4">
          <input v-model="newItem.name" placeholder="Nazwa narzędzia" class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
          <input v-model="newItem.category" placeholder="Kategoria" class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
          <div class="flex gap-2">
            <button @click="saveItem" class="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">Opublikuj</button>
            <button @click="showModal = false" class="px-6 bg-slate-100 py-3 rounded-xl font-bold">Anuluj</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const client = useSupabaseClient()
const showModal = ref(false)
const newItem = ref({ name: '', category: '', description: '', lat: null, lng: null })

const { data: items, refresh } = await useAsyncData('items', async () => {
  const { data } = await client.from('items').select('*')
  return data
})

function handleMapClick(coords) {
  newItem.value.lat = coords.lat
  newItem.value.lng = coords.lng
  showModal.value = true
}

async function saveItem() {
  if (!newItem.value.name) return
  const { error } = await client.from('items').insert([newItem.value])
  if (!error) {
    showModal.value = false
    newItem.value = { name: '', category: '', description: '', lat: null, lng: null }
    await refresh()
  }
}
</script>

<style>
body { @apply antialiased overflow-hidden; }
</style>