<template>
  <div v-if="user || isGuestMode" class="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans relative">
    
    <header class="h-16 bg-white border-b px-4 md:px-6 flex items-center justify-between z-30 shadow-sm flex-shrink-0 relative">
      <div class="flex items-center gap-2 mx-auto md:mx-0 font-bold text-lg md:text-xl tracking-tight text-slate-800">
        <div class="bg-green-600 p-1.5 rounded-lg text-white text-sm md:text-base"><Hammer :size="18" /></div>
        <span>Sąsiedzka Pożyczalnia</span>
      </div>
      
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
        <span v-if="user" class="text-xs text-slate-400 font-normal">Zalogowany jako: {{ user?.email }}</span>

        <button v-if="user" @click="checkProfileBeforeAdding" 
          :class="isPlacingMode ? 'bg-amber-500 text-white border-amber-500 scale-105' : 'bg-white text-green-600 border-green-600 hover:bg-green-50'"
          class="px-4 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all duration-200 cursor-pointer"
        >
          {{ isPlacingMode ? '📍 Wybierz miejsce...' : '＋ Dodaj przedmiot' }}
        </button>

        <template v-if="user">
          <button @click="showChat = true" class="relative hover:text-green-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 transition cursor-pointer">
            <MessageSquare :size="14" /> Wiadomości
            <span v-if="totalUnread > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{{ totalUnread }}</span>
          </button>
          <button @click="showDashboard = true" class="hover:text-green-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-green-200 transition cursor-pointer"><User :size="14" /> Mój Panel</button>
          <button @click="logout" class="text-red-500 hover:text-red-700 font-medium text-xs border border-red-100 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 transition cursor-pointer"><LogOut :size="14" /> Wyloguj się</button>
        </template>
        <button v-else @click="isGuestMode = false" class="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition cursor-pointer"><LogIn :size="14" /> Zaloguj się</button>
      </nav>
    </header>

    <div class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
      <main class="w-full h-[40vh] md:h-full md:flex-1 relative z-0 border-b md:border-b-0 md:border-r border-slate-200">
        
        <!-- WYSZUKIWARKA ADRESÓW -->
        <div class="absolute top-4 left-4 right-4 md:left-16 md:right-auto md:w-80 z-[1000] flex gap-2">
          <div class="relative flex-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 flex items-center px-3 py-2">
            <Search class="text-slate-400 mr-2 flex-shrink-0" :size="16" />
            <input 
              v-model="addressQuery" 
              @keyup.enter="searchLocationByAddress"
              type="text" 
              placeholder="Wpisz miejscowość lub adres..." 
              class="w-full bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button v-if="addressQuery" @click="addressQuery = ''" class="text-slate-400 hover:text-slate-600 text-xs px-1">✕</button>
          </div>
          <button @click="searchLocationByAddress" class="bg-green-600 hover:bg-green-700 text-white px-4 rounded-2xl text-xs font-bold shadow-lg transition flex items-center justify-center flex-shrink-0 cursor-pointer">
            Szukaj
          </button>
        </div>

        <div v-if="isPlacingMode" class="absolute top-20 left-1/2 -translate-x-1/2 z-[1001] bg-slate-900/95 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-lg border border-amber-500/30 flex items-center gap-2 md:gap-3 backdrop-blur-sm text-[11px] md:text-sm font-semibold">
          <span>📍</span>
          <span>Kliknij na mapie miejsce dodania</span>
          <button @click.stop="isPlacingMode = false" class="ml-1 bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded-md text-[9px] text-slate-400 font-normal cursor-pointer">Anuluj</button>
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
          <div class="mt-3 space-y-3">
            <div class="relative">
              <Search class="absolute left-3 top-3 text-slate-400" :size="16" />
              <input v-model="searchQuery" type="text" placeholder="Szukaj narzędzi..." class="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-green-500 outline-none text-sm" />
            </div>
            <div class="relative">
              <Filter class="absolute left-3 top-3 text-slate-400" :size="16" />
              <select v-model="selectedCategory" @change="handleCategoryChange" class="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-green-500 appearance-none">
                <option value="">Wszystkie kategorie</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4 bg-slate-50/50">
          <div v-if="loadingItems && (!items || items.length === 0)" class="text-center py-8 flex flex-col items-center gap-2 text-slate-400 text-sm">
            <div class="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p>Wczytywanie ogłoszeń...</p>
          </div>
          <template v-else>
            <div v-for="item in filteredItems" :key="item.id" @click="openItemDetails(item)" class="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:border-green-500/40 hover:shadow-md transition-all duration-200 cursor-pointer flex gap-3 relative group">
              <div class="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0 text-xl border border-slate-200/40 overflow-hidden">
                <img v-if="item.image_path" :src="getImageUrl(item.image_path)" class="w-full h-full object-cover" />
                <Hammer v-else :size="24" class="text-slate-300" />
              </div>
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
            <div v-if="!filteredItems || filteredItems.length === 0" class="text-center text-slate-400 text-sm py-12">Brak narzędzi w tej okolicy.</div>
          </template>
        </div>
      </aside>
    </div>

    <!-- Modale i okna -->
    <ItemDetailsModal :item="selectedItem" :isLoggedIn="!!user" :distanceText="selectedItem ? formatDistance(selectedItem) : ''" @close="closeItemDetails" @trigger-login="selectedItem = null; isGuestMode = false;" @start-chat="openChatForItem" />
    <ProfileSetupModal v-if="showProfileForm && user" :userId="user.id" :userEmail="user.email || ''" :initialData="profileData" @close="showProfileForm = false" @success="showProfileForm = false; isPlacingMode = true; loadItems();" />
    <AddItemModal v-if="showModal && user && activeCoords" :coords="activeCoords" :userId="user.id" @close="showModal = false" @saved="showModal = false; activeCoords = null; loadItems();" />
    
    <ClientOnly>
      <ChatWindow v-if="user && user.id" v-show="showChat" :userId="user.id" :initial-conversations="conversationsList" ref="chatWindowRef" @close="showChat=false" @messages-read="handleMessagesRead"/>
    </ClientOnly>
  </div>

  <div v-else class="h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative px-4">
    <button @click="isGuestMode = true" class="absolute top-6 right-6 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-sm z-50 cursor-pointer">Przeglądaj bez konta →</button>
    <div class="w-full max-w-sm"><AuthScreen /></div>
  </div>
  
  <UserDashboard v-if="showDashboard && user" :myItems="myItemsOnlyForUser" @close="showDashboard = false" @profile-updated="loadItems" />
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { Hammer, User, LogOut, LogIn, Search, Filter, MessageSquare } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useItems } from '@/composables/useItems'
import { useChat } from '@/composables/useChat'

const client = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()

// 1. Logika przedmiotów z composable
const {
  loadingItems,
  items,
  mapCenter,
  searchQuery,
  selectedCategory,
  addressQuery,
  filteredItems,
  loadItems,
  formatDistance,
  initAutomaticLocation,
  goToMyLocation,
  searchLocationByAddress,
  getImageUrl
} = useItems()

// 2. Logika chatu z composable
const {
  conversationsList,
  showChat,
  totalUnread,
  loadConversations,
  handleMessagesRead,
  initGlobalNotifications,
  cleanupChat
} = useChat()

const showDashboard = ref(false)
const showModal = ref(false)
const isGuestMode = ref(true)
const isPlacingMode = ref(false)
const activeCoords = ref(null)
const showProfileForm = ref(false)
const profileData = ref({ name: '', surname: '', phone: '' })
const selectedItem = ref(null)
const chatWindowRef = ref(null)

const categories = ['Elektronika', 'Ogród', 'Budowlane', 'AGD', 'Sport', 'Inne']
let authSubscription
let visibilityListener
const isRefreshing = ref(false)

const myItemsOnlyForUser = computed(() => {
  const currentUserId = user.value?.id
  if (!items.value || !currentUserId) return []
  return items.value.filter(item => String(item.user_id).trim() === String(currentUserId).trim())
})

async function refreshEverything() {
  if (isRefreshing.value) return
  isRefreshing.value = true

  try {
    const { data: { session }, error } = await client.auth.getSession()
    if (error) throw error

    user.value = session?.user || null
    await loadItems()

    if (!session?.user) {
      cleanupChat()
      return
    }

    await loadConversations(session.user.id)
    initGlobalNotifications(session.user.id)
  } catch (err) {
    console.error('Błąd refreshEverything:', err)
  } finally {
    isRefreshing.value = false
  }
}

onMounted(async () => {
  if (route.query.category) {
    selectedCategory.value = route.query.category
  }
  if (route.query.item) {
    await loadItems()
    const found = items.value.find(i => String(i.id) === String(route.query.item))
    if (found) selectedItem.value = found
  }

  initAutomaticLocation()
  await refreshEverything()

  visibilityListener = async () => {
    if (document.visibilityState === 'visible') {
      await refreshEverything()
    }
  }
  document.addEventListener('visibilitychange', visibilityListener)

  const { data } = client.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
    if (event === 'SIGNED_OUT') {
      cleanupChat()
      return
    }
    if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
      setTimeout(() => refreshEverything(), 0)
    }
  })
  authSubscription = data.subscription
})

onUnmounted(() => {
  authSubscription?.unsubscribe()
  if (visibilityListener) document.removeEventListener('visibilitychange', visibilityListener)
  cleanupChat()
})

function openItemDetails(item) {
  router.push(`/items/${item.id}`)
}

function closeItemDetails() {
  selectedItem.value = null
  const query = { ...route.query }
  delete query.item
  router.push({ query })
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
    const { data: profile } = await client.from('profiles').select('name, surname, phone').eq('id', userId).maybeSingle()
    if (profile?.name && profile.surname && profile.phone && profile.phone !== 'EMPTY') {
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
    showProfileForm.value = true
  }
}

function handleMapClick(coords) {
  if (isPlacingMode.value) {
    activeCoords.value = coords
    isPlacingMode.value = false
    showModal.value = true
  }
}

async function logout() {
  await client.auth.signOut()
  cleanupChat()
  showDashboard.value = false
}

const openChatForItem = (item) => {
  showChat.value = true
  nextTick(() => {
    chatWindowRef.value?.findOrCreateConversation(item)
  })
}

function handleCategoryChange() {
  const query = { ...route.query }
  if (selectedCategory.value) {
    query.category = selectedCategory.value
  } else {
    delete query.category
  }
  router.push({ query })
}
</script>