<template>
  <div class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex justify-end" @click="$emit('close')">
    <div class="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-slide-left" @click.stop>
      
      <!-- Nagłówek -->
      <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 class="text-xl font-black text-slate-800">Panel użytkownika</h2>
          <p class="text-xs text-slate-400 mt-0.5">Zarządzaj swoimi danymi, ogłoszeniami i rezerwacjami</p>
        </div>
        <button @click="$emit('close')" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer">
          <X :size="18" />
        </button>
      </div>

      <!-- Zakładki -->
      <div class="flex border-b border-slate-100 px-4 bg-white">
        <button 
          @click="activeTab = 'items'" 
          :class="activeTab === 'items' ? 'border-green-600 text-green-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 text-center py-3 text-xs md:text-sm border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Package :size="16" /> Ogłoszenia ({{ localMyItems.length }})
        </button>
        <button 
          @click="activeTab = 'rentals'" 
          :class="activeTab === 'rentals' ? 'border-green-600 text-green-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 text-center py-3 text-xs md:text-sm border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer relative"
        >
          <CalendarCheck :size="16" /> Wypożyczenia
          <span v-if="pendingRequestsCount > 0" class="absolute top-2 right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {{ pendingRequestsCount }}
          </span>
        </button>
        <button 
          @click="activeTab = 'account'" 
          :class="activeTab === 'account' ? 'border-green-600 text-green-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 text-center py-3 text-xs md:text-sm border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <User :size="16" /> Profil
        </button>
      </div>

      <!-- Treść zakładek -->
      <div class="flex-1 overflow-y-auto p-6 bg-slate-50/30">
        
        <!-- ZAKŁADKA 1: MOJE OGŁOSZENIA -->
        <div v-if="activeTab === 'items'" class="space-y-3">
          <div v-if="loadingItems" class="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
            <div class="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Wczytywanie Twoich narzędzi...</span>
          </div>

          <template v-else>
            <div v-if="localMyItems.length === 0" class="text-center py-12 text-slate-400 text-sm">
              Nie dodałeś jeszcze żadnych narzędzi.
            </div>
            
            <div 
              v-for="item in localMyItems" 
              :key="item.id" 
              class="bg-white border border-slate-150 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4"
            >
              <div class="min-w-0">
                <h3 class="font-bold text-sm text-slate-800 truncate">{{ item.name }}</h3>
                <p v-if="item.category" class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold inline-block mt-1 uppercase tracking-wider">{{ item.category }}</p>
              </div>
              <div class="flex gap-2">
                <button @click="editingItem = item" class="text-xs font-bold text-blue-500 hover:bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 transition flex-shrink-0 cursor-pointer flex items-center gap-1">
                  <Edit3 :size="14" /> Edytuj
                </button>
                <button @click="handleDeleteItem(item)" class="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-100 transition flex-shrink-0 cursor-pointer flex items-center gap-1">
                  <Trash2 :size="14" /> Usuń
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- ZAKŁADKA 2: WYPOŻYCZENIA -->
        <div v-if="activeTab === 'rentals'" class="space-y-4">
          <div v-if="loadingRentals" class="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
            <div class="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Wczytywanie rezerwacji...</span>
          </div>

          <template v-else>
            <div v-if="incomingRentals.length === 0 && myRentals.length === 0" class="text-center py-12 text-slate-400 text-sm">
              Brak aktywnych wypożyczeń lub próśb.
            </div>

            <!-- Otrzymane prośby -->
            <div v-if="incomingRentals.length > 0" class="space-y-3">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Prośby o Twoje przedmioty</h3>
              <div v-for="rental in incomingRentals" :key="rental.id" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" :class="getStatusBadgeClass(rental.status)">
                    {{ getStatusText(rental.status) }}
                  </span>
                  <h4 class="font-bold text-sm text-slate-800 mt-1">Przedmiot: {{ rental.items?.name }}</h4>
                  <p class="text-xs text-slate-500 mt-0.5">Wypożyczający: <span class="font-semibold text-slate-700">{{ rental.borrower?.name }} {{ rental.borrower?.surname }}</span></p>
                <p class="text-xs text-slate-600 mt-1 flex items-center gap-1 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span>Termin:</span> 
               <span class="font-bold text-slate-800">{{ rental.start_date }} do {{ rental.end_date }}</span>
                </p>
                </div>

                <div v-if="rental.status === 'pending'" class="flex gap-2 pt-2 border-t border-slate-100">
                  <button @click="updateRentalStatus(rental.id, 'accepted', currentUserId)" class="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5">
                    <Check :size="14" /> Zaakceptuj
                  </button>
                  <button @click="updateRentalStatus(rental.id, 'rejected', currentUserId)" class="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5">
                    <XCircle :size="14" /> Odrzuć
                  </button>
                </div>

                <div v-if="rental.status === 'accepted'" class="pt-2 border-t border-slate-100">
                  <button @click="updateRentalStatus(rental.id, 'active', currentUserId)" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer">
                    Oznacz jako wydane (W trakcie)
                  </button>
                </div>
                
                <div v-if="rental.status === 'active'" class="pt-2 border-t border-slate-100">
                  <button @click="updateRentalStatus(rental.id, 'completed', currentUserId)" class="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer">
                    Potwierdź zwrot (Zakończone)
                  </button>
                </div>
              </div>
            </div>

            <!-- Moje wysłane prośby -->
            <div v-if="myRentals.length > 0" class="space-y-3 pt-4">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Moje rezerwacje sprzętu</h3>
              <div v-for="rental in myRentals" :key="rental.id" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
                <div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" :class="getStatusBadgeClass(rental.status)">
                    {{ getStatusText(rental.status) }}
                  </span>
                  <h4 class="font-bold text-sm text-slate-800 mt-1">{{ rental.items?.name }}</h4>
                  <p class="text-xs text-slate-500 mt-0.5">Właściciel: <span class="font-semibold text-slate-700">{{ rental.items?.profiles?.name }}</span></p>
                <p class="text-xs text-slate-600 mt-1 flex items-center gap-1 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                 <span>Termin:</span> 
                <span class="font-bold text-slate-800">{{ rental.start_date }} do {{ rental.end_date }}</span>
                </p>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ZAKŁADKA 3: PROFIL -->
        <div v-if="activeTab === 'account'" class="space-y-4">
          <div v-if="loadingProfile" class="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
            <div class="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Wczytywanie danych konta...</span>
          </div>

          <template v-else>
            <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Imię</label>
                <input v-model="profileData.name" placeholder="np. Jan" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium" />
              </div>
              <div>
                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nazwisko</label>
                <input v-model="profileData.surname" placeholder="np. Kowalski" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium" />
              </div>
              <div>
                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Numer telefonu</label>
                <input v-model="profileData.phone" type="tel" placeholder="np. 500 600 700" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-bold text-slate-700 tracking-wide" />
              </div>
            </div>

            <button @click="handleUpdateProfile" :disabled="isSaving" class="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg text-sm cursor-pointer">
              <Save :size="16" />
              <span>{{ isSaving ? 'Zapisywanie zmian...' : 'Zapisz aktualne dane' }}</span>
            </button>
            
            <p v-if="saveSuccess" class="text-center text-xs text-green-600 font-semibold animate-pulse">
              Dane konta zostały pomyślnie zaktualizowane!
            </p>
          </template>
        </div>
      </div>
    </div>

    <AddItemModal 
      v-if="editingItem" 
      :editItem="editingItem" 
      @close="editingItem = null" 
      @saved="editingItem = null; initializeDashboard(); $emit('profile-updated');" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { X, Package, CalendarCheck, User, Edit3, Trash2, Check, XCircle, Save } from 'lucide-vue-next'
import { useRentals } from '@/composables/useRentals'
import { useItems } from '@/composables/useItems'
import { useProfile } from '@/composables/useProfile'

const emit = defineEmits(['close', 'profile-updated'])
const client = useSupabaseClient()

const activeTab = ref('items')
const editingItem = ref(null)
const currentUserId = ref(null)

// Podpinamy nasze niezależne composables
const { 
  loadingRentals, incomingRentals, myRentals, 
  pendingRequestsCount, fetchRentals, updateRentalStatus,
  getStatusText, getStatusBadgeClass 
} = useRentals()

const { 
  loadingItems, localMyItems, fetchUserItems, deleteItem 
} = useItems()

const { 
  loadingProfile, isSaving, saveSuccess, profileData, fetchUserProfile, updateProfile 
} = useProfile()

async function initializeDashboard() {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (session?.user?.id) {
      currentUserId.value = session.user.id
      await Promise.all([
        fetchUserProfile(session.user.id),
        fetchUserItems(session.user.id),
        fetchRentals(session.user.id)
      ])
    }
  } catch (err) {
    console.error('Błąd inicjalizacji:', err)
  }
}

async function handleDeleteItem(item) {
  await deleteItem(item, () => {
    fetchRentals(currentUserId.value)
  })
}

async function handleUpdateProfile() {
  await updateProfile(currentUserId.value, () => {
    emit('profile-updated')
  })
}

onMounted(() => { initializeDashboard() })
</script>

<style scoped>
@keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
.animate-slide-left { animation: slideLeft 0.25s ease-out forwards; }
</style>