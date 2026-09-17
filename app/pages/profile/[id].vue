<template>
  <div class="min-h-screen bg-slate-50/50 pb-20">
    
    <!-- Górny pasek nawigacyjny / powrót -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-6 mb-6">
      <button 
        @click="router.back()" 
        class="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200/80 hover:shadow"
      >
        <ArrowLeft :size="16" /> Wróć do mapy
      </button>
    </div>

    <!-- Stan ładowania -->
    <div v-if="loading" class="text-center py-24 text-slate-400 font-medium flex flex-col items-center gap-3">
      <div class="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      Ładowanie profilu...
    </div>

    <!-- Jeśli nie znaleziono użytkownika -->
    <div v-else-if="!profile" class="max-w-md mx-auto mt-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center space-y-3">
      <div class="w-12 h-12 bg-red-50 text-red-500 rounded-2xl mx-auto flex items-center justify-center font-bold text-xl">!</div>
      <h2 class="text-xl font-bold text-slate-800">Nie znaleziono użytkownika</h2>
      <p class="text-sm text-slate-500">Ten profil nie istnieje lub został usunięty.</p>
    </div>

    <!-- Główna zawartość profilu (wszystko w jednej, wycentrowanej kolumnie) -->
    <div v-else class="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
      
      <!-- Karta Główna (Profil / Hero) -->
      <div class="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden relative">
        <!-- Dekoracyjne tło profilu -->
        <div class="h-32 bg-gradient-to-r from-green-600/10 via-emerald-500/5 to-teal-600/10 border-b border-slate-100"></div>
        
        <div class="px-6 sm:px-8 pb-8 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-14 text-center sm:text-left">
          <!-- Awatar -->
          <div class="w-28 h-28 bg-white text-green-600 font-black text-4xl rounded-3xl flex items-center justify-center shadow-lg border-4 border-white flex-shrink-0">
            {{ profile.name?.charAt(0).toUpperCase() || 'U' }}
          </div>
          
          <!-- Dane osobowe i statystyki w nagłówku -->
          <div class="flex-1 space-y-1 mt-2 sm:mt-0">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {{ profile.name || 'Nieznany' }} {{ profile.surname || '' }}
                </h1>
                <p class="text-xs text-green-700 font-bold uppercase tracking-wider mt-0.5">Zweryfikowany członek społeczności</p>
              </div>

              <!-- Statystyki w pigułkach -->
              <div class="flex items-center justify-center gap-2">
                <div class="bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-2xl text-center">
                  <span class="block text-lg font-black text-slate-800">{{ userItems.length }}</span>
                  <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Przedmioty</span>
                </div>
                <div class="bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-2xl text-center">
                  <span class="block text-lg font-black text-amber-500">★ {{ computedAverageRating }}</span>
                  <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ocena</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sekcja 1: Udostępniane przedmioty (Pełna szerokość) -->
      <div class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-lg font-bold text-slate-900">
            Udostępniane przedmioty
          </h3>
          <span class="text-xs font-semibold text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-full">
            {{ userItems.length }}
          </span>
        </div>

        <div v-if="userItems.length === 0" class="bg-white p-8 rounded-3xl border border-slate-200/80 text-center text-slate-400 text-sm">
          Ten użytkownik nie dodał jeszcze żadnych przedmiotów do wypożyczenia.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            v-for="item in userItems" 
            :key="item.id"
            @click="router.push(`/?item=${item.id}`)"
            class="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 hover:border-green-500/50 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group"
          >
            <div class="flex gap-4 items-start">
              <div class="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-300 border border-slate-100">
                <img v-if="item.image_path" :src="getImageUrl(item.image_path)" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <span v-else class="text-slate-400">
                  <Camera :size="24" />
                </span>
              </div>
              <div class="overflow-hidden space-y-1 flex-1">
                <span v-if="item.category" class="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider inline-block">
                  {{ item.category }}
                </span>
                <h4 class="font-bold text-slate-900 truncate text-sm group-hover:text-green-600 transition">{{ item.name }}</h4>
                <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">{{ item.description || 'Brak opisu przedmiotu' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sekcja 2: Opinie (Pod spodem, pełna szerokość dopasowana do layoutu) -->
      <div class="space-y-4 pt-4">
        <ProfileReviews 
          :profile-id="profileId" 
          :current-user-id="user?.id" 
          :is-logged-in="isLoggedIn" 
          @rating-updated="(val) => currentAverageRating = val"
        />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Camera } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const client = useSupabaseClient()
const user = useSupabaseUser()

const isLoggedIn = computed(() => !!user.value)
const profileId = route.params.id

const profile = ref(null)
const userItems = ref([])
const loading = ref(true)
const currentAverageRating = ref(null)

const computedAverageRating = computed(() => {
  return currentAverageRating.value !== null ? currentAverageRating.value : '0.0'
})

onMounted(async () => {
  try {
    const { data: profileData, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle()

    if (profileError) console.error('Błąd profilu:', profileError.message)
    profile.value = profileData

    const { data: itemsData, error: itemsError } = await client
      .from('items')
      .select('*')
      .eq('user_id', profileId)

    if (itemsError) console.error('Błąd przedmiotów:', itemsError.message)
    userItems.value = itemsData || []

  } catch (err) {
    console.error('Błąd ładowania strony profilu:', err)
  } finally {
    loading.value = false
  }
})

function getImageUrl(path) {
  const { data } = client.storage.from('items').getPublicUrl(path)
  return data.publicUrl
}
</script>