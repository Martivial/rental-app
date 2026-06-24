<template>
  <div v-if="user || isGuestMode" class="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans relative">
    
    <header class="h-16 bg-white border-b px-4 md:px-6 flex items-center justify-between z-30 shadow-sm flex-shrink-0 relative">
      <div class="flex items-center gap-2 mx-auto md:mx-0 font-bold text-lg md:text-xl tracking-tight text-slate-800">
        <div class="bg-green-600 p-1.5 rounded-lg text-white text-sm md:text-base"><Hammer :size="18" /></div>
        <span>Sąsiedzka Pożyczalnia</span>
      </div>
      
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
        <span v-if="user" class="text-xs text-slate-400 font-normal">Zalogowany jako: {{ user?.email }}</span>
        
        <button 
          v-if="user"
          @click="checkProfileBeforeAdding" 
          :class="isPlacingMode ? 'bg-amber-500 text-white border-amber-500 scale-105' : 'bg-white text-green-600 border-green-600 hover:bg-green-50'"
          class="px-4 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all duration-200 flex items-center gap-1.5"
        >
          <Plus :size="14" /> {{ isPlacingMode ? 'Wybierz miejsce...' : 'Dodaj przedmiot' }}
        </button>

        <template v-if="user">
          <button @click="showDashboard = true" class="hover:text-green-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-green-200 transition">
            <User :size="14" /> Mój Panel
          </button>
          <button @click="logout" class="text-red-500 hover:text-red-700 font-medium text-xs border border-red-100 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 transition flex items-center gap-1.5">
            <LogOut :size="14" /> Wyloguj się
          </button>
        </template>
        <button v-else @click="isGuestMode = false" class="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition flex items-center gap-1.5">
          <LogIn :size="14" /> Zaloguj się
        </button>
      </nav>
    </header>

    <div class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
      <main class="w-full h-[40vh] md:h-full md:flex-1 relative z-0 border-b md:border-b-0 md:border-r border-slate-200">
        <div v-if="isPlacingMode" class="absolute top-2 left-1/2 -translate-x-1/2 z-[1001] bg-slate-900/95 text-white px-4 py-2 rounded-2xl shadow-lg border border-amber-500/30 flex items-center gap-2 backdrop-blur-sm text-sm font-semibold">
          <span>📍</span> Kliknij na mapie miejsce dodania
          <button @click.stop="isPlacingMode = false" class="ml-2 bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">Anuluj</button>
        </div>

        <ClientOnly>
          <TheMap :items="filteredItems" :center="mapCenter" :isPlacingMode="isPlacingMode" @map-click="handleMapClick" @marker-click="openItemDetails" />
        </ClientOnly>

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
          <div class="mt-2 space-y-2">
            <div class="relative">
              <Search class="absolute left-3 top-3 text-slate-400" :size="14" />
              <input v-model="searchQuery" type="text" placeholder="Szukaj narzędzi..." class="w-full bg-slate-100 border-none rounded-xl py-2.5 px-4 pl-10 focus:ring-2 focus:ring-green-500 outline-none text-sm" />
            </div>
            <div class="relative">
              <SlidersHorizontal class="absolute left-3 top-3 text-slate-400" :size="14" />
              <select v-model="selectedCategory" class="w-full bg-slate-100 border-none rounded-xl py-2.5 px-4 pl-10 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-green-500 appearance-none">
                <option value="">Wszystkie kategorie</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4 bg-slate-50/50">
          <div v-if="pending && (!items || items.length === 0)" class="text-center py-8 text-slate-400 text-sm">Wczytywanie...</div>
          <template v-else>
            <div v-for="item in filteredItems" :key="item.id" @click="openItemDetails(item)" class="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:border-green-500/40 hover:shadow-md transition-all cursor-pointer flex gap-3 relative group">
              <div class="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-200/40 overflow-hidden">
                <img v-if="item.image_path" :src="getImageUrl(item.image_path)" class="w-full h-full object-cover" />
                <Hammer v-else :size="24" class="text-slate-300" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-sm text-slate-800 truncate">{{ item.name }}</h3>
                <p v-if="item.category" class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold inline-block mt-0.5 uppercase">{{ item.category }}</p>
                <span class="block text-[10px] text-slate-400 mt-1 font-medium">📍 {{ formatDistance(item) }}</span>
              </div>
            </div>
          </template>
        </div>
      </aside>
    </div>

    <nav class="md:hidden h-16 bg-white border-t border-slate-200 flex items-center justify-around z-30 px-4 shadow-lg flex-shrink-0">
      <button v-if="user" @click="checkProfileBeforeAdding" :class="['flex flex-col items-center gap-0.5 text-[11px] font-bold transition', isPlacingMode ? 'text-amber-500 scale-105' : 'text-green-600']">
        <Plus :size="20" /> <span>Dodaj</span>
      </button>
      <template v-if="user">
        <button @click="showDashboard = true" class="flex flex-col items-center gap-0.5 text-[11px] font-bold text-slate-400">
          <User :size="20" /> <span>Panel</span>
        </button>
        <button @click="logout" class="flex flex-col items-center gap-0.5 text-[11px] font-bold text-red-500">
          <LogOut :size="20" /> <span>Wyloguj</span>
        </button>
      </template>
    </nav>

    <ItemDetailsModal 
      :item="selectedItem" 
      :isLoggedIn="!!user" 
      :distanceText="selectedItem ? formatDistance(selectedItem) : ''" 
      @close="selectedItem = null" 
      @trigger-login="selectedItem = null; isGuestMode = false;" 
      @open-chat="handleOpenChat" 
    />
    <ProfileSetupModal v-if="showProfileForm && user" :userId="user.id" :userEmail="user.email || ''" :initialData="profileData" @close="showProfileForm = false" @success="showProfileForm = false; isPlacingMode = true; refresh();" />
    <AddItemModal v-if="showModal && user && activeCoords" :coords="activeCoords" :userId="user.id" :edit-item="selectedItem" @close="showModal = false; selectedItem = null;" @saved="showModal = false; activeCoords = null; selectedItem = null; refresh();" /> 
    
    <UserDashboard v-if="showDashboard && user" :myItems="myItemsOnly" @close="showDashboard = false" @delete-item="deleteItem" @profile-updated="refresh" />
    <ChatWindow v-if="showChat && user" :item="selectedItem" :conversationId="activeConversationId" :userId="user.id" @close="showChat = false" />
  </div>
  
  <div v-else class="h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative px-4">
    <div class="w-full max-w-sm"><AuthScreen /></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Hammer, Plus, User, LogOut, LogIn, MapPin, Search, SlidersHorizontal } from 'lucide-vue-next'

const client = useSupabaseClient()
const user = useSupabaseUser() 

const showDashboard = ref(false)
const showModal = ref(false)
const showChat = ref(false)
const activeConversationId = ref(null)
const isGuestMode = ref(false)
const mapCenter = ref(null)
const isPlacingMode = ref(false)
const activeCoords = ref(null)
const showProfileForm = ref(false)
const profileData = ref({ name: '', surname: '', phone: '' })
const selectedItem = ref(null)
const searchQuery = ref('')
const selectedCategory = ref('')
const categories = ['Elektronika', 'Ogród', 'Budowlane', 'AGD', 'Sport', 'Inne']

const { data: items, refresh, pending } = await useLazyAsyncData('items', async () => {
  const { data, error } = await client.from('items').select('*, profiles(*)')
  if (error) { console.error("Błąd pobierania:", error.message); return [] }
  return data || []
}, { immediate: true })

async function handleOpenChat(item) {
  if (!user.value) return
  const { data: existing } = await client
    .from('conversations')
    .select('id')
    .eq('item_id', item.id)
    .or(`user1_id.eq.${user.value.id},user2_id.eq.${user.value.id}`)
    .maybeSingle()

  if (existing) {
    activeConversationId.value = existing.id
  } else {
    const { data: newConv } = await client
      .from('conversations')
      .insert({ item_id: item.id, user1_id: user.value.id, user2_id: item.user_id })
      .select()
      .single()
    activeConversationId.value = newConv.id
  }
  showChat.value = true
}

function getImageUrl(path) {
  if (!path) return null
  const { data } = client.storage.from('items').getPublicUrl(path)
  return data.publicUrl
}

const filteredItems = computed(() => {
  if (!items.value) return []
  return items.value.filter(item => {
    const s = searchQuery.value.toLowerCase()
    const matchesSearch = item.name.toLowerCase().includes(s)
    const matchesCategory = selectedCategory.value === '' || item.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const myItemsOnly = computed(() => {
  const currentUserId = user.value?.id
  if (!items.value || !currentUserId) return []
  return items.value.filter(item => String(item.user_id).trim() === String(currentUserId).trim())
})

function openItemDetails(item) { selectedItem.value = item }

async function getValidUserId() {
  if (user.value?.id) return user.value.id
  const { data: { session } } = await client.auth.getSession()
  if (session?.user?.id) { user.value = session.user; return session.user.id }
  return null
}

async function checkProfileBeforeAdding() {
  const userId = await getValidUserId()
  if (!userId || userId === 'undefined') { isGuestMode.value = false; return }
  if (isPlacingMode.value) { isPlacingMode.value = false; return }
  try {
    const { data: profile, error } = await client.from('profiles').select('name, surname, phone').eq('id', userId).maybeSingle()
    if (profile?.name && profile.surname && profile.phone && profile.phone !== 'EMPTY') { isPlacingMode.value = true } 
    else { 
      profileData.value = { name: profile?.name || '', surname: profile?.surname || '', phone: (profile?.phone === 'EMPTY' ? '' : profile?.phone) || '' }
      showProfileForm.value = true 
    }
  } catch (err) { showProfileForm.value = true }
}

function formatDistance(item) {
  if (!mapCenter.value || !item.lat || !item.lng) return 'Lokalizacja nieznana'
  const R = 6371000
  const lat1 = mapCenter.value.lat * Math.PI / 180, lat2 = item.lat * Math.PI / 180
  const deltaLat = (item.lat - mapCenter.value.lat) * Math.PI / 180
  const deltaLng = (item.lng - mapCenter.value.lng) * Math.PI / 180
  const a = Math.sin(deltaLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng/2)**2
  const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
  return distance < 1000 ? `${Math.round(distance)}m stąd` : `${(distance/1000).toFixed(1)}km stąd`
}

function initAutomaticLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => { mapCenter.value = { lat: pos.coords.latitude, lng: pos.coords.longitude } }, null, { timeout: 5000 })
  }
}

onMounted(async () => {
  initAutomaticLocation()
  client.auth.onAuthStateChange((event, session) => { user.value = session?.user || null; refresh() })
})

function goToMyLocation() {
  navigator.geolocation.getCurrentPosition((pos) => { mapCenter.value = { lat: pos.coords.latitude, lng: pos.coords.longitude } })
}

function handleMapClick(coords) { activeCoords.value = coords; isPlacingMode.value = false; showModal.value = true }

async function logout() { await client.auth.signOut(); user.value = null; refresh(); window.location.reload(); }
async function deleteItem(id) { 
  if (confirm('Usunąć ogłoszenie?')) { await client.from('items').delete().eq('id', id); await refresh() } 
}
</script>