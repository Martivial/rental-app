<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto space-y-6">
      
      <!-- Przycisk powrotu -->
      <button 
        @click="router.back()" 
        class="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200"
      >
        <ArrowLeft :size="18" /> Wróć do mapy
      </button>

      <!-- Stan ładowania -->
      <div v-if="loading" class="text-center py-12 text-slate-400 font-medium">
        Ładowanie profilu...
      </div>

      <!-- Jeśli nie znaleziono użytkownika -->
      <div v-else-if="!profile" class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-2">
        <h2 class="text-xl font-bold text-slate-800">Nie znaleziono użytkownika</h2>
        <p class="text-sm text-slate-500">Ten profil nie istnieje lub został usunięty.</p>
      </div>

      <!-- Główna karta profilu -->
      <template v-else>
        <div class="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
          <!-- Awatar / Inicjał -->
          <div class="w-24 h-24 bg-green-100 text-green-700 font-black text-3xl rounded-full flex items-center justify-center shadow-inner">
            {{ profile.name?.charAt(0).toUpperCase() || 'U' }}
          </div>
          
          <div class="text-center sm:text-left space-y-1">
            <h1 class="text-2xl font-black text-slate-800">
              {{ profile.name || 'Nieznany' }} {{ profile.surname || '' }}
            </h1>
            <p class="text-xs text-slate-400 uppercase font-bold tracking-wider">Użytkownik wypożyczalni</p>
          </div>
        </div>

        <!-- Sekcja: Przedmioty użytkownika -->
        <div class="space-y-4">
          <h3 class="text-lg font-bold text-slate-800 px-1">
            Przedmioty udostępniane przez użytkownika ({{ userItems.length }})
          </h3>

          <div v-if="userItems.length === 0" class="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
            Ten użytkownik nie dodał jeszcze żadnych przedmiotów.
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              v-for="item in userItems" 
              :key="item.id"
              @click="router.push(`/?item=${item.id}`)"
              class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition cursor-pointer flex gap-4 items-center group"
            >
              <div class="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-300">
                <img v-if="item.image_path" :src="getImageUrl(item.image_path)" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <span v-else class="flex items-center justify-center text-slate-400">
                  <Camera :size="22" />
                </span>
              </div>
              <div class="overflow-hidden">
                <span v-if="item.category" class="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block mb-1">
                  {{ item.category }}
                </span>
                <h4 class="font-bold text-slate-800 truncate text-sm group-hover:text-green-600 transition">{{ item.name }}</h4>
                <p class="text-xs text-slate-400 truncate">{{ item.description || 'Brak opisu' }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Camera } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const client = useSupabaseClient()

const profileId = route.params.id
const profile = ref(null)
const userItems = ref([])
const loading = ref(true)

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