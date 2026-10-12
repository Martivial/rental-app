<template>
  <div v-if="item" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Nagłówek modala -->
      <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <span v-if="item.category" class="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {{ item.category }}
          </span>
          <h2 class="text-xl font-black text-slate-900 mt-1">{{ item.name }}</h2>
        </div>
        <button @click="$emit('close')" class="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold transition cursor-pointer">
          ✕
        </button>
      </div>

      <!-- Treść modala -->
      <div class="p-6 overflow-y-auto space-y-6 flex-1">
        
        <!-- Zdjęcie przedmiotu -->
        <div class="h-64 bg-slate-950 rounded-2xl overflow-hidden relative flex items-center justify-center">
          <div 
            v-if="item.image_path" 
            class="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110 pointer-events-none"
            :style="{ backgroundImage: `url(${getImageUrl(item.image_path)})` }"
          ></div>
          <img 
            v-if="item.image_path" 
            :src="getImageUrl(item.image_path)" 
            class="max-h-full max-w-full object-contain relative z-10" 
          />
          <span v-else class="text-slate-400 text-xs font-semibold">Brak zdjęcia</span>
        </div>

        <!-- Opis -->
        <div class="space-y-1.5">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Opis</h3>
          <p class="text-slate-600 text-sm leading-relaxed">{{ item.description || 'Brak opisu.' }}</p>
        </div>

        <!-- Informacja o właścicielu -->
        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Właściciel</span>
            <span class="font-bold text-slate-800 text-sm">
              {{ item.profiles?.name || 'Nieznany' }} {{ item.profiles?.surname || '' }}
            </span>
          </div>
          <button 
            @click="goToFullDetails"
            class="text-xs font-bold text-green-600 hover:text-green-700 bg-white border border-green-200 px-3 py-1.5 rounded-xl shadow-2xs transition cursor-pointer"
          >
            Pełny widok strony →
          </button>
        </div>

        <!-- Sekcja zajętych terminów (pobierana przez composable) -->
        <div v-if="acceptedRanges.length > 0" class="bg-red-50 border border-red-200 p-4 rounded-2xl space-y-2">
          <h4 class="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1.5">
            <Ban :size="14" /> Terminy niedostępne
          </h4>
          <div class="space-y-1">
            <div v-for="(range, idx) in acceptedRanges" :key="idx" class="text-xs text-red-700 font-bold bg-white px-3 py-2 rounded-xl border border-red-100 flex justify-between">
              <span>Od {{ range.start_date }} do {{ range.end_date }}</span>
              <span class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase">Zajęte</span>
            </div>
          </div>
        </div>

        <!-- Formularz rezerwacji w modalu -->
        <div class="border-t border-slate-100 pt-5 space-y-3">
          <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Szybka rezerwacja</h4>
          
          <template v-if="isLoggedIn">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] font-bold text-slate-500 block mb-1">Od kiedy</label>
                <input type="date" v-model="startDate" :min="todayString" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none" />
              </div>
              <div>
                <label class="text-[11px] font-bold text-slate-500 block mb-1">Do kiedy</label>
                <input type="date" v-model="endDate" :min="startDate || todayString" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none" />
              </div>
            </div>

            <button 
              @click="handleModalRequestRental"
              :disabled="isSubmitting"
              class="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-extrabold py-3 rounded-xl transition shadow-md text-xs cursor-pointer"
            >
              {{ isSubmitting ? 'Wysyłanie...' : 'Wyślij prośbę o rezerwację' }}
            </button>
          </template>

          <template v-else>
            <div class="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-xs font-bold text-center">
              Zaloguj się, aby złożyć rezerwację.
            </div>
          </template>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Ban } from 'lucide-vue-next'
import { useRentals } from '@/composables/useRentals'

const props = defineProps({
  item: Object,
  isLoggedIn: Boolean
})

const emit = defineEmits(['close', 'start-chat'])
const router = useRouter()
const client = useSupabaseClient()

// Wyciągamy całą logikę biznesową rezerwacji z composable!
const { acceptedRanges, fetchAcceptedRanges, requestRental } = useRentals()

const isSubmitting = ref(false)
const startDate = ref('')
const endDate = ref('')
const currentUserId = ref(null)

const todayString = computed(() => new Date().toISOString().split('T')[0])

onMounted(async () => {
  const { data: { session } } = await client.auth.getSession()
  if (session?.user) {
    currentUserId.value = session.user.id
  }
})

// Kiedy zmienia się wybrany przedmiot w modalu, pobieramy jego zajęte terminy
watch(() => props.item, async (newItem) => {
  if (newItem?.id) {
    await fetchAcceptedRanges(newItem.id)
    startDate.value = ''
    endDate.value = ''
  }
}, { immediate: true })

function getImageUrl(path) {
  const { data } = client.storage.from('items').getPublicUrl(path)
  return data.publicUrl
}

function goToFullDetails() {
  if (props.item?.id) {
    emit('close')
    router.push(`/items/${props.item.id}`)
  }
}

async function handleModalRequestRental() {
  if (!currentUserId.value) return
  isSubmitting.value = true
  try {
    await requestRental(props.item.id, currentUserId.value, startDate.value, endDate.value)
    alert("Wysłano prośbę o rezerwację!")
    startDate.value = ''
    endDate.value = ''
    await fetchAcceptedRanges(props.item.id)
  } catch (err) {
    alert("Błąd: " + err.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>
<style scoped>
.animate-slide-up { animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>