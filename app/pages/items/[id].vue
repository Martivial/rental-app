<template>
  <div class="min-h-screen bg-slate-50 pb-12">
    
    <!-- Pasek nawigacyjny / Powrót -->
    <div class="max-w-6xl mx-auto px-4 py-4">
      <button 
        @click="router.back()" 
        class="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
      >
        <ArrowLeft :size="18" /> Powrót do ogłoszeń
      </button>
    </div>

    <!-- Indicator ładowania -->
    <div v-if="loading" class="max-w-6xl mx-auto px-4 py-20 text-center">
      <div class="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-slate-500 text-sm font-semibold">Ładowanie szczegółów ogłoszenia...</p>
    </div>

    <!-- Informacja o braku ogłoszenia -->
    <div v-else-if="!item" class="max-w-6xl mx-auto px-4 py-20 text-center space-y-3">
      <h2 class="text-xl font-bold text-slate-800">Nie znaleziono takiego przedmiotu 🔍</h2>
      <p class="text-slate-500 text-sm">Ogłoszenie mogło zostać usunięte lub podany adres jest nieprawidłowy.</p>
    </div>

    <!-- Główna zawartość ogłoszenia -->
    <main v-else class="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <!-- Lewa kolumna: Zdjęcie i opis przedmiotu -->
      <section class="lg:col-span-7 space-y-6">
        
        <!-- Sekcja zdjęcia (object-contain + rozmyte tło) -->
        <div class="bg-slate-950 border border-slate-200 rounded-3xl overflow-hidden shadow-sm relative group flex items-center justify-center">
          
          <div 
            v-if="item.image_path" 
            class="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110 pointer-events-none"
            :style="{ backgroundImage: `url(${getImageUrl(item.image_path)})` }"
          ></div>

          <div class="h-80 sm:h-[420px] w-full flex items-center justify-center relative z-10 p-2">
            <img 
              v-if="item.image_path" 
              :src="getImageUrl(item.image_path)" 
              class="max-h-full max-w-full object-contain rounded-2xl drop-shadow-md" 
              alt="Zdjęcie ogłoszenia"
            />
            <span v-else class="text-slate-400 flex flex-col items-center gap-2">
              <Camera :size="48" />
              <span class="text-xs font-semibold">Brak zdjęcia</span>
            </span>

            <button 
              v-if="item.image_path"
              @click="zoomedImage = getImageUrl(item.image_path)"
              class="absolute bottom-4 right-4 bg-black/70 hover:bg-black text-white px-3.5 py-2 rounded-xl backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg border border-white/10"
            >
              <ZoomIn :size="16" /> Powiększ zdjęcie
            </button>
          </div>
        </div>

        <!-- Tytuł, kategoria i opis -->
        <div class="bg-white p-6 sm:p-8 border border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span v-if="item.category" class="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full uppercase tracking-wider">
                {{ item.category }}
              </span>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{{ item.name }}</h1>
            </div>
          </div>

          <div class="space-y-2">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Opis przedmiotu</h3>
            <p class="text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {{ item.description || 'Właściciel nie dodał jeszcze szczegółowego opisu.' }}
            </p>
          </div>
        </div>

      </section>

      <!-- Prawa kolumna: Właściciel, zajęte terminy i rezerwacja -->
      <section class="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
        
        <!-- Kafel właściciela -->
        <div 
          @click="navigateToProfile" 
          class="bg-white p-5 border border-slate-200 rounded-3xl shadow-sm flex items-center gap-4 hover:border-green-500/50 transition cursor-pointer group"
        >
          <div class="w-12 h-12 bg-green-100 text-green-700 font-black rounded-2xl flex items-center justify-center text-lg">
            {{ item.profiles?.name?.charAt(0).toUpperCase() || 'S' }}
          </div>
          <div class="flex-grow min-w-0">
            <span class="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Właściciel ogłoszenia</span>
            <span class="font-bold text-slate-900 text-base group-hover:text-green-600 transition truncate block">
              {{ item.profiles?.name || 'Nieznany' }} {{ item.profiles?.surname || '' }}
            </span>
          </div>
          <ChevronRight :size="18" class="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        <!-- Sekcja zablokowanych terminów -->
        <div v-if="acceptedRanges.length > 0" class="bg-red-50/90 border border-red-200 p-5 rounded-3xl space-y-3 shadow-xs">
          <h3 class="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-2">
            <Ban :size="16" /> Terminy niedostępne
          </h3>
          <p class="text-[11px] text-red-600/80 font-medium leading-tight">
            W poniższych dniach sprzęt jest już zarezerwowany. Wybierz inny termin w kalendarzu.
          </p>
          <div class="space-y-2 pt-1">
            <div 
              v-for="(range, idx) in acceptedRanges" 
              :key="idx" 
              class="text-xs text-red-700 font-bold bg-white p-3 rounded-2xl border border-red-100 flex items-center justify-between shadow-2xs"
            >
              <div class="flex items-center gap-2">
                <CalendarX :size="16" class="text-red-500 flex-shrink-0" />
                <span>Od <strong>{{ range.start_date }}</strong> do <strong>{{ range.end_date }}</strong></span>
              </div>
              <span class="text-[10px] bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">Zajęte</span>
            </div>
          </div>
        </div>

        <!-- Formularz rezerwacji -->
        <div class="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm space-y-4">
          <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar :size="18" class="text-green-600" /> Rezerwacja sprzętu
          </h3>

          <template v-if="isLoggedIn">
            <template v-if="!isOwner">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-bold text-slate-500 block mb-1">Od kiedy</label>
                  <input 
                    type="date" 
                    v-model="startDate" 
                    :min="todayString"
                    class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 block mb-1">Do kiedy</label>
                  <input 
                    type="date" 
                    v-model="endDate" 
                    :min="startDate || todayString"
                    class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <button 
                @click="handleRequestRental" 
                :disabled="isSubmitting"
                class="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-extrabold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 text-sm cursor-pointer"
              >
                <CalendarCheck :size="18" />
                <span>{{ isSubmitting ? 'Wysyłanie prośby...' : 'Wyślij prośbę o rezerwację' }}</span>
              </button>

              <div class="space-y-2 pt-2 border-t border-slate-100">
                <!-- Przycisk czatu -->
                <button 
                  @click="openChat"
                  class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-sm cursor-pointer shadow-sm mb-2"
                >
                  Napisz wiadomość do właściciela
                </button>

                <a 
                  v-if="item.profiles?.phone && item.profiles.phone !== 'EMPTY'" 
                  :href="'tel:' + item.profiles.phone" 
                  class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-sm"
                >
                  <Phone :size="16" /> Zadzwoń: {{ item.profiles.phone }}
                </a>
              </div>
            </template>

            <template v-else>
              <div class="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
                <p class="font-bold text-slate-800 text-sm">To jest Twoje własne ogłoszenie 📦</p>
                <p class="text-slate-500 text-xs">Możesz edytować to ogłoszenie w swoim panelu.</p>
              </div>
            </template>
          </template>

          <template v-else>
            <div class="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs font-bold space-y-1">
              <p>Zaloguj się, aby zarezerwować ten przedmiot.</p>
            </div>
          </template>
        </div>

      </section>

    </main>

    <!-- Lightbox zdjęcia -->
    <div v-if="zoomedImage" @click="zoomedImage = null" class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer">
      <img :src="zoomedImage" class="max-w-full max-h-full object-contain rounded-2xl" />
    </div>

    <!-- Okno czatu działające w tle -->
    <ClientOnly>
      <ChatWindow 
        v-if="currentUserId" 
        v-show="showChat" 
        :userId="currentUserId" 
        :initial-conversations="conversationsList"
        ref="chatWindowRef" 
        @close="showChat = false"
        @messages-read="handleMessagesRead"
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Camera, ZoomIn, Ban, CalendarX, Calendar, CalendarCheck, Phone, ChevronRight } from 'lucide-vue-next'
import { useItems } from '@/composables/useItems'
import { useRentals } from '@/composables/useRentals'
import { useChat } from '@/composables/useChat'

const route = useRoute()
const router = useRouter()
const client = useSupabaseClient()

// Wykorzystujemy dedykowane composables zgodnie z dobrymi praktykami inżynierskimi
const { fetchItemSingle, getImageUrl } = useItems()
const { acceptedRanges, fetchAcceptedRanges, requestRental } = useRentals()
const { showChat, conversationsList, loadConversations, handleMessagesRead } = useChat()

const item = ref(null)
const loading = ref(true)
const isSubmitting = ref(false)
const zoomedImage = ref(null)
const currentUserId = ref(null)
const isLoggedIn = ref(false)
const chatWindowRef = ref(null)

const startDate = ref('')
const endDate = ref('')

const todayString = computed(() => new Date().toISOString().split('T')[0])

const isOwner = computed(() => {
  if (!item.value || !currentUserId.value) return false
  return String(item.value.user_id) === String(currentUserId.value)
})

onMounted(async () => {
  const { data: { session } } = await client.auth.getSession()
  if (session?.user) {
    isLoggedIn.value = true
    currentUserId.value = session.user.id
    await loadConversations(currentUserId.value)
  }

  await fetchItemDetails()
})

async function fetchItemDetails() {
  loading.value = true
  try {
    const itemId = route.params.id
    // Pobieramy dane przez nasz composable useItems
    item.value = await fetchItemSingle(itemId)

    if (item.value?.id) {
      await fetchAcceptedRanges(item.value.id)
    }
  } catch (err) {
    console.error('Błąd pobierania ogłoszenia:', err.message)
  } finally {
    loading.value = false
  }
}

function navigateToProfile() {
  if (item.value?.user_id) {
    router.push(`/profile/${item.value.user_id}`)
  }
}

async function handleRequestRental() {
  isSubmitting.value = true
  try {
    await requestRental(item.value.id, currentUserId.value, startDate.value, endDate.value)
    alert("Wysłano prośbę o rezerwację!")
    startDate.value = ''
    endDate.value = ''
    await fetchAcceptedRanges(item.value.id)
  } catch (err) {
    alert("Błąd: " + err.message)
  } finally {
    isSubmitting.value = false
  }
}

const openChat = () => {
  if (!currentUserId.value) {
    alert("Musisz się zalogować, aby napisać wiadomość.")
    return
  }
  showChat.value = true
  nextTick(() => {
    chatWindowRef.value?.findOrCreateConversation(item.value)
  })
}
</script>