<!-- app.vue -->
<template>
  <div v-if="user || isGuestMode" class="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans relative">
    
    <!-- HEADER -->
    <header class="h-16 bg-white border-b px-4 md:px-6 flex items-center justify-between z-30 shadow-sm flex-shrink-0 relative">
      <div class="flex items-center gap-2 mx-auto md:mx-0 font-bold text-lg md:text-xl tracking-tight text-slate-800">
        <div class="bg-green-600 p-1.5 rounded-lg text-white text-sm md:text-base">🛠️</div>
        <span>Sąsiedzka Pożyczalnia</span>
      </div>
      
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
        <span v-if="user" class="text-xs text-slate-400 font-normal">Zalogowany jako: {{ user?.email }}</span>
        
        <button 
          v-if="user"
          @click="checkProfileBeforeAdding" 
          :class="isPlacingMode ? 'bg-amber-500 text-white border-amber-500 scale-105' : 'bg-white text-green-600 border-green-600 hover:bg-green-50'"
          class="px-4 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all duration-200"
        >
          {{ isPlacingMode ? '📍 Wybierz miejsce...' : '＋ Dodaj przedmiot' }}
        </button>

        <template v-if="user">
          <button @click="showDashboard = true" class="hover:text-green-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-green-200 transition">👤 Mój Panel</button>
          <button @click="logout" class="text-red-500 hover:text-red-700 font-medium text-xs border border-red-100 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 transition">Wyloguj się</button>
        </template>
        <button v-else @click="isGuestMode = false" class="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition">Zaloguj się / Rejestracja 🔑</button>
      </nav>
    </header>

    <!-- GŁÓWNY UKŁAD -->
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
      
      <!-- MAPA -->
      <main class="w-full h-[40vh] md:h-full md:flex-1 relative z-0 border-b md:border-b-0 md:border-r border-slate-200">
        
        <div v-if="isPlacingMode" class="absolute top-2 left-1/2 -translate-x-1/2 z-[1001] bg-slate-900/95 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-lg border border-amber-500/30 flex items-center gap-2 md:gap-3 backdrop-blur-sm text-[11px] md:text-sm font-semibold max-w-[95%] w-auto whitespace-nowrap">
          <span>📍</span>
          <span>Kliknij na mapie miejsce dodania</span>
          <button @click.stop="isPlacingMode = false" class="ml-1 bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded-md text-[9px] text-slate-400 font-normal">Anuluj</button>
        </div>

        <ClientOnly>
          <TheMap 
            :items="items || []" 
            :center="mapCenter" 
            :isPlacingMode="isPlacingMode" 
            @map-click="handleMapClick" 
            @marker-click="openItemDetails"
          />
        </ClientOnly>
        
        <div @click="goToMyLocation" class="absolute bottom-4 left-4 z-[1000] bg-white px-3 py-1.5 rounded-xl shadow-md border border-green-500/20 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition active:scale-95 select-none">
          <div class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </div>
          <span class="text-[11px] font-bold text-slate-700">Twoja lokalizacja</span>
        </div>
      </main>

      <!-- PANEL BOCZNY (LISTA KAFELKÓW) -->
      <aside class="w-full flex-1 md:flex-none md:w-96 bg-white flex flex-col overflow-hidden shadow-inner md:shadow-xl z-10 relative">
        <div class="p-4 border-b bg-white flex-shrink-0">
          <h2 class="font-bold text-base text-slate-800 hidden md:block">Narzędzia w okolicy</h2>
          <div class="relative mt-0 md:mt-2">
            <input type="text" placeholder="Szukaj narzędzi w okolicy..." class="w-full bg-slate-100 border-none rounded-xl py-2.5 px-4 pl-10 focus:ring-2 focus:ring-green-500 outline-none text-sm" />
            <span class="absolute left-3 top-3 text-slate-400 text-sm">🔍</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4 bg-slate-50/50">
          <div v-if="pending && (!items || items.length === 0)" class="text-center py-8 flex flex-col items-center gap-2 text-slate-400 text-sm">
            <div class="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p>Wczytywanie ogłoszeń...</p>
          </div>

          <template v-else>
            <div 
              v-for="item in items" 
              :key="item.id" 
              @click="openItemDetails(item)"
              class="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:border-green-500/40 hover:shadow-md transition-all duration-200 cursor-pointer flex gap-3 relative group"
            >
              <div class="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0 text-xl border border-slate-200/40">📷</div>
              
              <div class="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between gap-1.5">
                    <h3 class="font-bold text-sm text-slate-800 truncate group-hover:text-green-600 transition">{{ item.name }}</h3>
                    <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">📍 {{ formatDistance(item) }}</span>
                  </div>
                  
                  <p v-if="item.category" class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold inline-block mt-0.5 uppercase tracking-wider">{{ item.category }}</p>
                  <p v-if="item.description" class="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">{{ item.description }}</p>
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

    <!-- DOLNA NAWIGACJA (MOBILE) -->
    <nav class="md:hidden h-16 bg-white border-t border-slate-200 flex items-center justify-around z-30 px-4 shadow-lg flex-shrink-0">
      <button v-if="user" @click="checkProfileBeforeAdding" :class="['flex flex-col items-center gap-0.5 text-[11px] font-bold transition', isPlacingMode ? 'text-amber-500 scale-105' : 'text-green-600']">
        <span class="text-lg">＋</span>
        <span>Dodaj</span>
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

    <!-- MODAL SZCZEGÓŁÓW OGŁOSZENIA -->
    <ItemDetailsModal 
      :item="selectedItem"
      :isLoggedIn="!!user"
      :distanceText="selectedItem ? formatDistance(selectedItem) : ''"
      @close="selectedItem = null"
      @trigger-login="selectedItem = null; isGuestMode = false;"
    />

    <!-- WYDZIELONY MODAL WSTĘPNEGO PROFILU -->
    <ProfileSetupModal 
      v-if="showProfileForm && user"
      :userId="user.id"
      :userEmail="user.email || ''"
      :initialData="profileData"
      @close="showProfileForm = false"
      @success="showProfileForm = false; isPlacingMode = true; refresh();"
    />

    <!-- WYDZIELONY MODAL DODAWANIA PRZEDMIOTU -->
    <AddItemModal 
      v-if="showModal && user && activeCoords"
      :coords="activeCoords"
      :userId="user.id"
      @close="showModal = false"
      @saved="showModal = false; activeCoords = null; refresh();"
    />
  </div>

  <!-- EKRAN LOGOWANIA -->
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
    @close="showDashboard = false"
    @delete-item="deleteItem"
    @profile-updated="refresh"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const client = useSupabaseClient()
const user = useSupabaseUser() 

const showDashboard = ref(false)
const showModal = ref(false)
const isGuestMode = ref(false)
const mapCenter = ref(null)

const isPlacingMode = ref(false)
const activeCoords = ref(null) // Przechowuje kliknięte z mapy koordynaty przekazywane do AddItemModal

const showProfileForm = ref(false)
const profileData = ref({ name: '', surname: '', phone: '' })

const selectedItem = ref(null)

const { data: items, refresh, pending } = await useLazyAsyncData('items', async () => {
  const { data, error } = await client.from('items').select('*, profiles(*)')
  if (error) {
    console.error("Błąd pobierania przedmiotów:", error.message)
    return []
  }
  return data || []
}, { immediate: true })

const myItemsOnly = computed(() => {
  const currentUserId = user.value?.id
  if (!items.value || !currentUserId) return []
  return items.value.filter(item => String(item.user_id).trim() === String(currentUserId).trim())
})

function openItemDetails(item) {
  selectedItem.value = item
}

async function getValidUserId() {
  if (user.value?.id) return user.value.id
  const { data: { session } } = await client.auth.getSession()
  if (session?.user?.id) {
    user.value = session.user
    return session.user.id
  }
  return null
}

async function checkProfileBeforeAdding() {
  const userId = await getValidUserId()
  if (!userId || userId === 'undefined') {
    isGuestMode.value = false
    return
  }
  if (isPlacingMode.value) {
    isPlacingMode.value = false
    return
  }

  try {
    const { data: profile, error } = await client
      .from('profiles')
      .select('name, surname, phone')
      .eq('id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error("Błąd bazy:", error.message)
    }

    const hasName = profile?.name && profile.name.trim() !== ''
    const hasSurname = profile?.surname && profile.surname.trim() !== ''
    const hasPhone = profile?.phone && profile.phone.trim() !== '' && profile.phone !== 'EMPTY'

    if (hasName && hasSurname && hasPhone) {
      isPlacingMode.value = true
    } else {
      profileData.value = {
        name: profile?.name || '',
        surname: profile?.surname || '',
        phone: (profile?.phone === 'EMPTY' ? '' : profile?.phone) || ''
      }
      showProfileForm.value = true
    }
  } catch (err) {
    console.error("Wyjątek:", err)
    showProfileForm.value = true
  }
}

function formatDistance(item) {
  if (!mapCenter.value || !item.lat || !item.lng) return 'Lokalizacja nieznana'
  const R = 6371000 
  const lat1 = mapCenter.value.lat * Math.PI / 180
  const lat2 = item.lat * Math.PI / 180
  const deltaLat = (item.lat - mapCenter.value.lat) * Math.PI / 180
  const deltaLng = (item.lng - mapCenter.value.lng) * Math.PI / 180

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c 

  return distance < 1000 ? `${Math.round(distance)}m stąd` : `${(distance / 1000).toFixed(1)}km stąd`
}

function initAutomaticLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapCenter.value = { lat: position.coords.latitude, lng: position.coords.longitude }
      },
      () => console.log("Brak GPS"),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    )
  }
}

onMounted(async () => {
  initAutomaticLocation()
  const { data: { session } } = await client.auth.getSession()
  if (session?.user) {
    user.value = session.user
  }

  const route = useRoute()
  const router = useRouter()
  if (route.query.code) {
    router.replace({ query: {} })
  }

  client.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      user.value = session.user
      isGuestMode.value = false
    } else {
      user.value = null
    }
    await refresh()
  })
})

function goToMyLocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (position) => {
      mapCenter.value = { lat: position.coords.latitude, lng: position.coords.longitude }
    },
    (error) => console.error(error),
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  )
}

function handleMapClick(coords) {
  if (!user.value || !isPlacingMode.value) return 
  activeCoords.value = coords // Zapisujemy współrzędne kliknięcia mapy
  isPlacingMode.value = false 
  showModal.value = true      
}

async function logout() {
  await client.auth.signOut()
  user.value = null
  isGuestMode.value = false
  showDashboard.value = false
  selectedItem.value = null
  await refresh()
}

async function deleteItem(id) {
  if (!confirm('Usunąć ogłoszenie?')) return
  const { error } = await client.from('items').delete().eq('id', id)
  if (!error) await refresh()
}
</script>