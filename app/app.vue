<template>
  <div v-if="user || isGuestMode" class="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans relative">
    
    <header class="hidden md:flex h-16 bg-white border-b px-6 items-center justify-between z-30 shadow-sm">
      <div class="flex items-center gap-2">
        <div class="bg-green-600 p-1.5 rounded-lg text-white">🛠️</div>
        <h1 class="font-bold text-xl tracking-tight text-slate-800">Sąsiedzka Pożyczalnia</h1>
      </div>
      
      <nav class="flex items-center gap-6 text-sm font-semibold text-slate-600">
        <span v-if="user" class="text-xs text-slate-400 font-normal">Zalogowany jako: {{ user?.email }}</span>
        <button @click="viewMode = 'all'" :class="viewMode === 'all' ? 'text-green-600' : 'hover:text-green-600 transition'">Przeglądaj</button>
        <template v-if="user">
          <button @click="showDashboard = true" class="hover:text-green-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-green-200 transition">👤 Mój Panel</button>
          <button @click="logout" class="text-red-500 hover:text-red-700 font-medium text-xs border border-red-100 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 transition">Wyloguj się</button>
        </template>
        <button v-else @click="isGuestMode = false" class="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition">Zaloguj się / Rejestracja 🔑</button>
      </nav>
    </header>

    <div class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
      
      <aside :class="[
        'bg-white shadow-xl z-20 flex flex-col overflow-hidden transition-all duration-300',
        'fixed bottom-0 left-0 right-0 h-[45vh] rounded-t-3xl md:relative md:h-full md:w-96 md:rounded-none md:order-2',
        mobileView === 'map' ? 'translate-y-full md:translate-y-0' : 'translate-y-0'
      ]">
        <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 md:hidden"></div>

        <div class="p-4 border-b pt-0 md:pt-4">
          <h2 class="font-bold text-base md:text-lg text-slate-800">Narzędzia w okolicy</h2>
          <div class="mt-2 relative">
            <input type="text" placeholder="Szukaj narzędzi..." class="w-full bg-slate-100 border-none rounded-xl py-2 px-4 pl-10 focus:ring-2 focus:ring-green-500 outline-none text-sm" />
            <span class="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3 pb-24 md:pb-4">
          <div v-if="pending" class="text-center py-8 flex flex-col items-center gap-2 text-slate-400 text-sm">
            <div class="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p>Wczytywanie ogłoszeń...</p>
          </div>

          <template v-else>
            <div v-for="item in items" :key="item.id" class="bg-white border rounded-2xl p-3 shadow-sm border-slate-100">
              <div class="flex gap-3">
                <div class="w-20 h-20 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">📷</div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-sm text-slate-800 truncate">{{ item.name }}</h3>
                  <p class="text-green-600 font-bold text-xs">25 zł/dzień</p>
                  <div class="flex items-center justify-between mt-2">
                     <span class="text-[11px] text-slate-400">📍 350m</span>
                     <button @click="handleReserveClick" class="bg-green-600 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold uppercase">Rezerwuj</button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <main class="flex-1 h-full w-full relative md:order-1">
        <ClientOnly>
          <TheMap :items="items || []" @map-click="handleMapClick" />
        </ClientOnly>
      </main>

    </div>

    <div class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around z-30 px-6 shadow-lg">
      <button @click="mobileView = 'map'" :class="['flex flex-col items-center gap-1 text-xs font-bold', mobileView === 'map' ? 'text-green-600' : 'text-slate-400']">
        <span>🗺️</span> <span>Mapa</span>
      </button>
      <button @click="mobileView = 'list'" :class="['flex flex-col items-center gap-1 text-xs font-bold', mobileView === 'list' ? 'text-green-600' : 'text-slate-400']">
        <span>📋</span> <span>Lista</span>
      </button>
      <button v-if="user" @click="showDashboard = true" class="flex flex-col items-center gap-1 text-xs font-bold text-slate-400">
        <span>👤</span> <span>Panel</span>
      </button>
      <button v-else @click="isGuestMode = false" class="flex flex-col items-center gap-1 text-xs font-bold text-green-600">
        <span>🔑</span> <span>Zaloguj</span>
      </button>
    </div>

    <div v-if="showModal" class="fixed inset-0 flex items-end md:items-center justify-center z-[9999] p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl animate-slide-up">
        <h2 class="text-xl md:text-2xl font-bold mb-4">Dodaj nowe ogłoszenie</h2>
        <div class="space-y-4">
          <input v-model="newItem.name" placeholder="Nazwa narzędzia" class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          <input v-model="newItem.category" placeholder="Kategoria" class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          <div class="flex gap-2 pt-2">
            <button @click="saveItem" class="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm">Opublikuj</button>
            <button @click="showModal = false" class="px-6 bg-slate-100 py-3 rounded-xl font-bold text-sm">Anuluj</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative px-4">
    <button @click="isGuestMode = true" class="absolute top-6 right-6 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-sm z-50">
      Przeglądaj bez konta →
    </button>
    <div class="w-full max-w-sm">
      <AuthScreen />
    </div>
  </div>
  
  <UserDashboard 
    v-if="showDashboard && user"
    :myItems="myItemsOnly"
    :allItems="items || []"
    @close="showDashboard = false"
    @delete-item="deleteItem"
  />
</template>

<script setup>
import { ref, computed, onMounted, watchEffect } from 'vue'

const client = useSupabaseClient()
const user = useSupabaseUser() 

const showDashboard = ref(false)
const showModal = ref(false)
const isGuestMode = ref(false)
const viewMode = ref('all')
const mobileView = ref('map') // 'map' lub 'list' - sterowanie widokiem na telefonie
const newItem = ref({ name: '', category: '', description: '', lat: null, lng: null })

const { data: items, refresh, pending } = await useLazyAsyncData('items', async () => {
  const { data } = await client.from('items').select('*')
  return data
}, { immediate: true })

const myItemsOnly = computed(() => {
  const currentUserId = user.value?.id || client.auth.user?.()?.id
  if (!items.value || !currentUserId) return []
  return items.value.filter(item => String(item.user_id).trim() === String(currentUserId).trim())
})

onMounted(async () => {
  const { data: { session } } = await client.auth.getSession()
  if (session?.user) user.value = session.user

  client.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      user.value = session.user
      isGuestMode.value = false
    } else {
      user.value = null
    }
    refresh()
  })
})

function handleMapClick(coords) {
  if (!user.value) return 
  newItem.value.lat = coords.lat
  newItem.value.lng = coords.lng
  showModal.value = true
}

function handleReserveClick() {
  if (!user.value) {
    isGuestMode.value = false
    return
  }
}

async function logout() {
  await client.auth.signOut()
  user.value = null
  isGuestMode.value = false
  showDashboard = false
}

async function saveItem() {
  if (!newItem.value.name || !user.value) return
  const { data: { session } } = await client.auth.getSession()
  if (!session?.user?.id) return

  const itemToSave = {
    name: newItem.value.name,
    category: newItem.value.category || '',
    description: newItem.value.description || '',
    lat: newItem.value.lat,
    lng: newItem.value.lng,
    user_id: session.user.id
  }

  const { error } = await client.from('items').insert([itemToSave])
  if (!error) {
    showModal.value = false
    newItem.value = { name: '', category: '', description: '', lat: null, lng: null }
    await refresh()
  }
}

async function deleteItem(id) {
  if (!confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) return
  const { error } = await client.from('items').delete().eq('id', id)
  if (!error) await refresh()
}
</script>

<style scoped>
/* Płynne wysuwanie modali na telefonie */
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}
</style>