<template>
  <!-- GŁÓWNY KONTENER APLIKACJI -->
  <div v-if="user || isGuestMode" class="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans relative">
    
    <header class="h-16 bg-white border-b px-4 md:px-6 flex items-center justify-between z-30 shadow-sm flex-shrink-0 relative">
      <div class="flex items-center gap-2 mx-auto md:mx-0 font-bold text-lg md:text-xl tracking-tight text-slate-800">
        <div class="bg-green-600 p-1.5 rounded-lg text-white text-sm md:text-base">🛠️</div>
        <span>Sąsiedzka Pożyczalnia</span>
      </div>
      
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
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
      
      <main class="w-full h-[40vh] md:h-full md:flex-1 relative z-0 border-b md:border-b-0 md:border-r border-slate-200">
        <ClientOnly>
          <!-- POPRAWKA 1: Podpięty prop :center, który przekazuje wybraną lokalizację do komponentu mapy -->
          <TheMap :items="items || []" :center="mapCenter" @map-click="handleMapClick" />
        </ClientOnly>
        
        <!-- POPRAWKA 2: Dodane @click="goToMyLocation", żeby przycisk w końcu reagował na kliknięcie -->
        <div @click="goToMyLocation" class="absolute bottom-4 left-4 z-[1000] bg-white px-3 py-1.5 rounded-xl shadow-md border border-green-500/20 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition active:scale-95 select-none">
          <div class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </div>
          <span class="text-[11px] font-bold text-slate-700">Twoja lokalizacja</span>
        </div>
      </main>

      <aside class="w-full flex-1 md:flex-none md:w-96 bg-white flex flex-col overflow-hidden shadow-inner md:shadow-xl z-10 relative">
        <div class="p-4 border-b bg-white flex-shrink-0">
          <h2 class="font-bold text-base text-slate-800 hidden md:block">Narzędzia w okolicy</h2>
          <div class="relative mt-0 md:mt-2">
            <input type="text" placeholder="Szukaj narzędzi w okolicy..." class="w-full bg-slate-100 border-none rounded-xl py-2.5 px-4 pl-10 focus:ring-2 focus:ring-green-500 outline-none text-sm" />
            <span class="absolute left-3 top-3 text-slate-400 text-sm">🔍</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4 bg-slate-50/50">
          <div v-if="pending" class="text-center py-8 flex flex-col items-center gap-2 text-slate-400 text-sm">
            <div class="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p>Wczytywanie ogłoszeń...</p>
          </div>

          <template v-else>
            <div v-for="item in items" :key="item.id" class="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm hover:border-green-100 transition">
              <div class="flex gap-3">
                <div class="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0 text-lg">📷</div>
                <div class="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 class="font-bold text-sm text-slate-800 truncate">{{ item.name }}</h3>
                    <p class="text-green-600 font-extrabold text-xs mt-0.5">opis</p>
                  </div>
                  <div class="flex items-center justify-between mt-2">
                     <span class="text-[11px] text-slate-400">📍 350m stąd</span>
                     <button @click="handleReserveClick" class="bg-green-600 hover:bg-green-700 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition">Rezerwuj</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="!items || items.length === 0" class="text-center text-slate-400 text-sm py-12">
              Brak narzędzi w tej okolicy.
            </div>
          </template>
        </div>
      </aside>

    </div>

    <nav class="md:hidden h-16 bg-white border-t border-slate-200 flex items-center justify-around z-30 px-4 shadow-lg flex-shrink-0">
      <button @click="viewMode = 'all'" :class="['flex flex-col items-center gap-0.5 text-[11px] font-bold transition', viewMode === 'all' ? 'text-green-600' : 'text-slate-400']">
        <span class="text-lg">🔍</span>
        <span>Przeglądaj</span>
      </button>
      
      <template v-if="user">
        <button @click="showDashboard = true" class="flex flex-col items-center gap-0.5 text-[11px] font-bold text-slate-400">
          <span class="text-lg">👤</span>
          <span>Mój Panel</span>
        </button>
        <button @click="logout" class="flex flex-col items-center gap-0.5 text-[11px] font-bold text-red-500">
          <span class="text-lg">🚪</span>
          <span>Wyloguj</span>
        </button>
      </template>
      
      <button v-else @click="isGuestMode = false" class="flex flex-col items-center gap-0.5 text-[11px] font-bold text-green-600">
        <span class="text-lg">🔑</span>
        <span>Zaloguj się</span>
      </button>
    </nav>

    <div v-if="showModal" class="fixed inset-0 flex items-end md:items-center justify-center z-[9999] p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl animate-slide-up">
        <h2 class="text-xl md:text-2xl font-bold mb-4 text-slate-800">Dodaj nowe ogłoszenie</h2>
        <div class="space-y-4">
          <input v-model="newItem.name" placeholder="Nazwa narzędzia (np. Wiertarka Udarowa)" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          <input v-model="newItem.category" placeholder="Kategoria (np. Elektronarzędzia)" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          <div class="flex gap-3 pt-2">
            <button @click="saveItem" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition">Opublikuj</button>
            <button @click="showModal = false" class="px-6 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl font-bold text-sm text-slate-600 transition">Anuluj</button>
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
import { ref, computed, onMounted } from 'vue'

const client = useSupabaseClient()
const user = useSupabaseUser() 

const showDashboard = ref(false)
const showModal = ref(false)
const isGuestMode = ref(false)
const viewMode = ref('all')
const newItem = ref({ name: '', category: '', description: '', lat: null, lng: null })

// POPRAWKA 3: Dodajemy reaktywną zmienną przechowującą aktualny środek mapy
const mapCenter = ref(null)

const { data: items, refresh, pending } = await useLazyAsyncData('items', async () => {
  const { data } = await client.from('items').select('*')
  return data
}, { immediate: true })

const myItemsOnly = computed(() => {
  const currentUserId = user.value?.id || client.auth.user?.()?.id
  if (!items.value || !currentUserId) return []
  return items.value.filter(item => String(item.user_id).trim() === String(currentUserId).trim())
})

function initAutomaticLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Jeśli użytkownik pozwoli na GPS, zapisujemy jego pozycję
        mapCenter.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      },
      (error) => {
        // Jeśli odmówi lub wystąpi błąd, nie robimy nic (zostanie domyślna Warszawa)
        console.log("Automatyczna lokalizacja niedostępna, ładowanie domyślnego widoku.");
      },
      {
        enableHighAccuracy: false,
        timeout: 5000, // Czekaj maksymalnie 5 sekund na GPS
        maximumAge: 60000
      }
    )
  }
}

onMounted(async () => {
  // Uruchamiamy automatyczne sprawdzanie lokalizacji zaraz po włączeniu apki
  initAutomaticLocation()

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

// POPRAWKA 4: Dodajemy funkcję geolokalizacji, która pyta system i aktualizuje mapCenter
function goToMyLocation() {
  if (!navigator.geolocation) {
    alert("Geolokalizacja nie jest wspierana przez Twoją przeglądarkę.")
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      // Przepisujemy współrzędne z GPS urządzenia do zmiennej mapCenter
      mapCenter.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
    },
    (error) => {
      alert("Nie udało się pobrać lokalizacji. Sprawdź uprawnienia strony.")
      console.error(error)
    },
    {
      enableHighAccuracy: false, // Bezpieczny tryb dla localhost / środowiska testowego
      timeout: 10000,
      maximumAge: 60000
    }
  )
}

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
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}
</style>