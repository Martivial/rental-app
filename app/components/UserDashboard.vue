<template>
  <div class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex justify-end" @click="$emit('close')">
    <div class="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-slide-left" @click.stop>
      
      <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 class="text-xl font-black text-slate-800">Panel użytkownika</h2>
          <p class="text-xs text-slate-400 mt-0.5">Zarządzaj swoimi danymi i ogłoszeniami</p>
        </div>
        <button @click="$emit('close')" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition">✕</button>
      </div>

      <div class="flex border-b border-slate-100 px-6 bg-white">
        <button 
          @click="activeTab = 'items'" 
          :class="activeTab === 'items' ? 'border-green-600 text-green-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 text-center py-3.5 text-sm border-b-2 transition"
        >
          📦 Moje ogłoszenia ({{ localMyItems.length }})
        </button>
        <button 
          @click="activeTab = 'account'" 
          :class="activeTab === 'account' ? 'border-green-600 text-green-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 text-center py-3.5 text-sm border-b-2 transition"
        >
          👤 Moje konto / Profil
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 bg-slate-50/30">
        
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
                <button 
                  @click="editingItem = item" 
                  class="text-xs font-bold text-blue-500 hover:bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 transition flex-shrink-0"
                >
                  ✏️ Edytuj
                </button>
                <button 
                  @click="deleteLocalItem(item.id)" 
                  class="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-100 transition flex-shrink-0"
                >
                  🗑️ Usuń
                </button>
              </div>
            </div>
          </template>
        </div>

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

            <button 
              @click="updateProfile" 
              :disabled="isSaving"
              class="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-green-600/10 text-sm"
            >
              <span>{{ isSaving ? 'Zapisywanie zmian...' : '💾 Zapisz aktualne dane' }}</span>
            </button>
            
            <p v-if="saveSuccess" class="text-center text-xs text-green-600 font-semibold animate-pulse">
              ✓ Dane konta zostały pomyślnie zaktualizowane!
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

const emit = defineEmits(['close', 'delete-item', 'profile-updated'])
const client = useSupabaseClient()

const activeTab = ref('items')
const loadingProfile = ref(true)
const loadingItems = ref(true)
const isSaving = ref(false)
const saveSuccess = ref(false)
const editingItem = ref(null)

const localMyItems = ref([])
const currentUserId = ref(null)

const profileData = ref({ name: '', surname: '', phone: '' })

async function initializeDashboard() {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (session?.user?.id) {
      currentUserId.value = session.user.id
      await Promise.all([
        fetchUserProfile(session.user.id),
        fetchUserItems(session.user.id)
      ])
    } else {
      loadingProfile.value = false
      loadingItems.value = false
    }
  } catch (err) {
    loadingProfile.value = false
    loadingItems.value = false
  }
}

async function fetchUserProfile(userId) {
  loadingProfile.value = true
  try {
    const { data, error } = await client.from('profiles').select('name, surname, phone').eq('id', userId).maybeSingle()
    if (!error && data) {
      profileData.value.name = data.name || ''
      profileData.value.surname = data.surname || ''
      profileData.value.phone = data.phone === 'EMPTY' ? '' : (data.phone || '')
    }
  } finally {
    loadingProfile.value = false
  }
}

async function fetchUserItems(userId) {
  loadingItems.value = true
  try {
    const { data, error } = await client.from('items').select('*').eq('user_id', userId)
    if (!error && data) localMyItems.value = data
  } finally {
    loadingItems.value = false
  }
}

async function updateProfile() {
  if (!profileData.value.name.trim() || !profileData.value.surname.trim() || !profileData.value.phone.trim()) {
    return alert("Wszystkie pola profilu muszą być wypełnione!")
  }
  isSaving.value = true
  try {
    const { error } = await client.from('profiles').upsert({
      id: currentUserId.value,
      name: profileData.value.name.trim(),
      surname: profileData.value.surname.trim(),
      phone: profileData.value.phone.trim(),
      updated_at: new Date()
    })
    if (error) throw error
    saveSuccess.value = true
    emit('profile-updated')
    setTimeout(() => { saveSuccess.value = false }, 4000)
  } catch (err) { alert("Błąd: " + err.message) } finally { isSaving.value = false }
}

async function deleteLocalItem(id) {
  emit('delete-item', id)
  localMyItems.value = localMyItems.value.filter(item => item.id !== id)
}

onMounted(() => { initializeDashboard() })
</script>

<style scoped>
@keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
.animate-slide-left { animation: slideLeft 0.25s ease-out forwards; }
</style>