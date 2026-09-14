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
          class="px-4 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all duration-200"
        >
          {{ isPlacingMode ? '📍 Wybierz miejsce...' : '＋ Dodaj przedmiot' }}
        </button>

        <template v-if="user">
           <button @click="showChat = true" class="relative hover:text-green-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 transition">
          <MessageSquare :size="14" /> Wiadomości
          <span v-if="totalUnread > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{{ totalUnread }}</span>
        </button>
          <button @click="showDashboard = true" class="hover:text-green-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-green-200 transition"><User :size="14" /> Mój Panel</button>
          <button @click="logout" class="text-red-500 hover:text-red-700 font-medium text-xs border border-red-100 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 transition"><LogOut :size="14" /> Wyloguj się</button>
        </template>
        <button v-else @click="isGuestMode = false" class="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition"><LogIn :size="14" /> Zaloguj się</button>
      </nav>
    </header>

    <div class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
      <main class="w-full h-[40vh] md:h-full md:flex-1 relative z-0 border-b md:border-b-0 md:border-r border-slate-200">
        <div v-if="isPlacingMode" class="absolute top-2 left-1/2 -translate-x-1/2 z-[1001] bg-slate-900/95 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-lg border border-amber-500/30 flex items-center gap-2 md:gap-3 backdrop-blur-sm text-[11px] md:text-sm font-semibold max-w-[95%] w-auto whitespace-nowrap">
          <span>📍</span>
          <span>Kliknij na mapie miejsce dodania</span>
          <button @click.stop="isPlacingMode = false" class="ml-1 bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded-md text-[9px] text-slate-400 font-normal">Anuluj</button>
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
          <div v-if="pending && (!items || items.length === 0)" class="text-center py-8 flex flex-col items-center gap-2 text-slate-400 text-sm">
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

    <nav class="md:hidden h-16 bg-white border-t border-slate-200 flex items-center justify-around z-30 px-4 shadow-lg flex-shrink-0">
      <button v-if="user" @click="checkProfileBeforeAdding" :class="['flex flex-col items-center gap-0.5 text-[11px] font-bold transition', isPlacingMode ? 'text-amber-500 scale-105' : 'text-green-600']">
        <Plus :size="20" /> <span>Dodaj</span>
      </button>
      <button @click="showChat = true" class="relative flex flex-col items-center gap-0.5 text-[11px] font-bold text-slate-500">
        <MessageSquare :size="20" /> <span>Chat</span>
        <span v-if="totalUnread > 0" class="absolute top-0 right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{{ totalUnread }}</span>
      </button>
      <template v-if="user">
        <button @click="showDashboard = true" class="flex flex-col items-center gap-0.5 text-[11px] font-bold text-slate-400"><User :size="20" /> <span>Panel</span></button>
        <button @click="logout" class="flex flex-col items-center gap-0.5 text-[11px] font-bold text-red-500"><LogOut :size="20" /> <span>Wyloguj</span></button>
      </template>
      <button v-else @click="isGuestMode = false" class="flex flex-col items-center gap-0.5 text-[11px] font-bold text-green-600"><LogIn :size="20" /> <span>Zaloguj</span></button>
    </nav>

    <ItemDetailsModal 
  :item="selectedItem" 
  :isLoggedIn="!!user" 
  :distanceText="selectedItem ? formatDistance(selectedItem) : ''" 
  @close="closeItemDetails"
  @trigger-login="selectedItem = null; isGuestMode = false;" 
  @start-chat="openChatForItem" 
/>
<ProfileSetupModal v-if="showProfileForm && user" :userId="user.id" :userEmail="user.email || ''" :initialData="profileData" @close="showProfileForm = false" @success="showProfileForm = false; isPlacingMode = true; refresh();" />
  <AddItemModal v-if="showModal && user && activeCoords" :coords="activeCoords" :userId="user.id" @close="showModal = false" @saved="showModal = false; activeCoords = null; refresh();" />
  
  <ClientOnly>
 <ChatWindow 
  v-if="user && user.id" 
  v-show="showChat" 
  :userId="user.id" 
  :initial-conversations="conversationsList"
  ref="chatWindowRef" 
  @close="showChat=false"
  @messages-read="handleMessagesRead"/>
</ClientOnly>
  </div>

  <div v-else class="h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative px-4">
    <button @click="isGuestMode = true" class="absolute top-6 right-6 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-sm z-50">Przeglądaj bez konta →</button>
    <div class="w-full max-w-sm"><AuthScreen /></div>
  </div>
  
  <UserDashboard v-if="showDashboard && user"
   :myItems="myItemsOnly" @close="showDashboard = false" @profile-updated="refresh" />
</template>

<script setup>

import { ref, computed, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { Hammer, Plus, User, LogOut, LogIn, Search, Filter, MessageSquare } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

const client = useSupabaseClient()
const user = useSupabaseUser()

const route = useRoute()
const router = useRouter()

const conversationsList = ref([])

const showDashboard = ref(false)
const showModal = ref(false)
const isGuestMode = ref(true)
const mapCenter = ref(null)
const isPlacingMode = ref(false)
const activeCoords = ref(null)
const showProfileForm = ref(false)
const profileData = ref({ name: '', surname: '', phone: '' })
const selectedItem = ref(null)
const showChat = ref(false)
const chatWindowRef = ref(null)

const searchQuery = ref('')
const selectedCategory = ref('')
const categories = ['Elektronika', 'Ogrod', 'Budowlane', 'AGD', 'Sport', 'Inne']

let authSubscription
let globalChannel
let visibilityListener
const isRefreshing = ref(false)

const items = ref([])
const pending = ref(false)


watch(items, (newItems) => {
  
  if (route.query.item && newItems.length > 0 && !selectedItem.value) {
  
    const foundItem = newItems.find(i => String(i.id) === String(route.query.item))
    
    if (foundItem) {
      selectedItem.value = foundItem
    }
  }
})

async function loadItems() {
  pending.value = true

  try {
    const { data, error } = await client.from('items').select('*, profiles(*)')

    if (error) {
      console.error('Błąd pobierania:', error.message)
      items.value = []
      return
    }

    items.value = data || []

    if (route.query.item && !selectedItem.value) {
      const foundItem = items.value.find(i => String(i.id) === String(route.query.item))
      if (foundItem) {
        selectedItem.value = foundItem
      }
    }

  } catch (err) {
    console.error('Błąd pobierania items:', err)
    items.value = []
  } finally {
    pending.value = false
  }
}

async function refresh() {
  await loadItems()
}

async function refreshEverything() {
  if (isRefreshing.value) return

  isRefreshing.value = true

  try {
    const { data: { session }, error } = await client.auth.getSession()

    if (error) {
      console.error('Błąd pobierania sesji:', error)
      return
    }

    user.value = session?.user || null

    await loadItems()

    if (!session?.user) {
      conversationsList.value = []

      if (globalChannel) {
        await client.removeChannel(globalChannel)
        globalChannel = null
      }
      return
    }

    await loadConversations()
    globalNotifications(session.user.id)
  } catch (err) {
    console.error('Błąd refreshEverything:', err)
  } finally {
    isRefreshing.value = false
  }
}

onMounted(async () => {

  if(route.query.category) {
    selectedCategory.value = route.query.category
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
      conversationsList.value = []

      if (globalChannel) {
        client.removeChannel(globalChannel)
        globalChannel = null
      }

      return
    }

    if (
      event === 'SIGNED_IN' ||
      event === 'TOKEN_REFRESHED' ||
      event === 'USER_UPDATED'
    ) {
      setTimeout(() => {
        refreshEverything()
      }, 0)
    }
  })

  authSubscription = data.subscription
})

onUnmounted(() => {
  authSubscription?.unsubscribe()

  if (visibilityListener) {
    document.removeEventListener('visibilitychange', visibilityListener)
  }

  if (globalChannel) {
    client.removeChannel(globalChannel)
    globalChannel = null
  }
})

function getImageUrl(path) {
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

function openItemDetails(item) {
  selectedItem.value = item
  router.push({ 
    query: { ...route.query, item: item.id } 
  })
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
    const { data: profile, error } = await client.from('profiles').select('name, surname, phone').eq('id', userId).maybeSingle()

    if (error) {
      console.error('Błąd pobierania profilu:', error.message)
    }

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

function formatDistance(item) {
  if (!mapCenter.value || !item.lat || !item.lng) return 'Lokalizacja nieznana'

  const R = 6371000
  const lat1 = mapCenter.value.lat * Math.PI / 180, lat2 = item.lat * Math.PI / 180
  const deltaLat = (item.lat - mapCenter.value.lat) * Math.PI / 180
  const deltaLng = (item.lng - mapCenter.value.lng) * Math.PI / 180
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))

  return distance < 1000 ? `${Math.round(distance)}m stąd` : `${(distance / 1000).toFixed(1)}km stąd`
}

function initAutomaticLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      mapCenter.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    }, null, { timeout: 5000 })
  }
}

function goToMyLocation() {
  navigator.geolocation.getCurrentPosition((pos) => {
    mapCenter.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
  })
}

function handleMapClick(coords) {
  if (isPlacingMode.value) {
    activeCoords.value = coords
    isPlacingMode.value = false
    showModal.value = true
  }
}

async function logout() {
  const { error } = await client.auth.signOut()

  if (error) {
    console.error('Błąd wylogowania:', error)
    return
  }

  conversationsList.value = []
  showChat.value = false
  showDashboard.value = false
}

const openChatForItem = (item) => {
  showChat.value = true
  nextTick(() => {
    chatWindowRef.value?.findOrCreateConversation(item)
  })
}

async function loadConversations() {
  const { data: { user: authUser }, error: authError } = await client.auth.getUser()

  if (authError || !authUser) {
    console.error("Brak zalogowanego użytkownika", authError)
    return
  }

  user.value = authUser

  const { data, error } = await client.from('conversations').select(`
    id, created_at, user1_id, user2_id, item_id,
    items(id, name, image_path),
    p1:profiles!conversations_user1_id_fkey(name),
    p2:profiles!conversations_user2_id_fkey(name),
    messages(id, is_read, sender_id)
  `)
    .or(`user1_id.eq.${authUser.id},user2_id.eq.${authUser.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Błąd pobierania wiadomości", error)
    return
  }

  conversationsList.value = (data || []).map(c => ({
    ...c,
    other_user_name: c.user1_id === authUser.id
      ? (c.p2?.name || 'Użytkownik')
      : (c.p1?.name || 'Użytkownik'),
    unread_count: c.messages ? c.messages.filter(m => !m.is_read && m.sender_id !== authUser.id).length : 0
  }))
}

const totalUnread = computed(() => {
  let sum = 0

  for (const chat of conversationsList.value) {
    sum += (chat.unread_count || 0)
  }

  return sum
})

function handleMessagesRead(conversationId) {
  const chat = conversationsList.value.find(c => c.id === conversationId)

  if (chat) {
    chat.unread_count = 0
  }
}

function globalNotifications(userId) {
  if (globalChannel) {
    client.removeChannel(globalChannel)
    globalChannel = null
  }

  globalChannel = client.channel('global-notifications').on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    const newMessage = payload.new

    if (newMessage.sender_id !== userId) {
      const chat = conversationsList.value.find(c => c.id === newMessage.conversationId)

      if (chat) {
        chat.unread_count = (chat.unread_count || 0) + 1
      } else {
        loadConversations()
      }
    }
  }).subscribe()
}

function handleCategoryChange() {
  const query = {...route.query}
  if(selectedCategory.value) {
    query.category = selectedCategory.value
  }
  else {delete query.category}
  router.push({query})
}
</script>