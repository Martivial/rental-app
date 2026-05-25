<template>
<div class="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-[9999] flex flex-col font-sans border-l border-slate-100">    <div class="p-6 border-b flex justify-between items-center bg-slate-50">
      <div>
        <h2 class="text-xl font-bold text-slate-800">Panel Użytkownika</h2>
        <p class="text-xs text-slate-400 mt-0.5">Zarządzaj swoimi przedmiotami i rezerwacjami</p>
      </div>
      <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-xl shadow-sm border w-9 h-9 flex items-center justify-center">✕</button>
    </div>

    <div class="flex border-b text-sm font-bold">
      <button @click="activeTab = 'items'" 
              :class="activeTab === 'items' ? 'border-b-2 border-green-600 text-green-600' : 'text-slate-400'"
              class="flex-1 py-4 text-center transition">
        Moje Przedmioty ({{ myItems.length }})
      </button>
      <button @click="activeTab = 'requests'" 
              :class="activeTab === 'requests' ? 'border-b-2 border-green-600 text-green-600' : 'text-slate-400'"
              class="flex-1 py-4 text-center transition">
        Prośby od sąsiadów ({{ pendingRequests.length }})
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      
      <div v-if="activeTab === 'items'" class="space-y-4">
        <div v-for="item in myItems" :key="item.id" 
             class="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm flex gap-4 items-center justify-between">
          <div class="flex gap-4 items-center">
            <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl">🛠️</div>
            <div>
              <h4 class="font-bold text-slate-800 text-sm">{{ item.name }}</h4>
              <p class="text-xs text-slate-400 uppercase font-semibold">{{ item.category || 'Inne' }}</p>
            </div>
          </div>
          <button @click="$emit('delete-item', item.id)" 
                  class="bg-red-50 hover:bg-red-100 text-red-500 p-2.5 rounded-xl transition">
            🗑️
          </button>
        </div>
        <div v-if="myItems.length === 0" class="text-center text-slate-400 text-sm py-12">Nie dodałeś jeszcze żadnych przedmiotów.</div>
      </div>

      <div v-if="activeTab === 'requests'" class="space-y-4">
        <div v-for="req in pendingRequests" :key="req.id" 
             class="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm space-y-3">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Status: {{ req.status }}
              </span>
              <h4 class="font-bold text-slate-800 text-sm mt-1.5">
                Przedmiot: {{ getItemName(req.item_id) }}
              </h4>
              <p class="text-xs text-slate-400">Data prośby: {{ new Date(req.created_at).toLocaleDateString() }}</p>
            </div>
          </div>

          <div v-if="req.status === 'oczekuje'" class="flex gap-2 pt-1">
            <button @click="updateRequestStatus(req.id, 'wypozyczone')" 
                    class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-xs font-bold transition">
              Akceptuj 👍
            </button>
            <button @click="updateRequestStatus(req.id, 'odrzucone')" 
                    class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition">
              Odrzuć
            </button>
          </div>
        </div>
        <div v-if="pendingRequests.length === 0" class="text-center text-slate-400 text-sm py-12">Brak aktualnych próśb o wypożyczenie.</div>
      </div>

    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps(['allItems'])
const emit = defineEmits(['close', 'delete-item'])
const client = useSupabaseClient()

const activeTab = ref('items')
const pendingRequests = ref([])

// NOWE: Lokalne, super szybkie zmienne dla Twoich przedmiotów
const myItems = ref([])
const loadingItems = ref(true)

// Funkcja pobierająca przedmioty zalogowanego użytkownika prosto z bazy danych
async function fetchMyItems() {
  loadingItems.value = true
  
  // Pobieramy sesję prosto z tokenu przeglądarki
  const { data: { session } } = await client.auth.getSession()
  const userId = session?.user?.id
  
  if (!userId) {
    myItems.value = []
    loadingItems.value = false
    return
  }

  // Odpytujemy bazę tylko o rekordy tego konkretnego użytkownika (błyskawiczne dzięki indeksowi!)
  const { data, error } = await client
    .from('items')
    .select('*')
    .eq('user_id', userId)

  if (!error) {
    myItems.value = data
  }
  loadingItems.value = false
}

function getItemName(itemId) {
  const item = props.allItems.find(i => i.id === itemId)
  return item ? item.name : 'Nieznane narzędzie'
}

// Pobieramy rezerwacje dotyczące przedmiotów tego użytkownika
async function fetchRequests() {
  const myItemIds = myItems.value.map(item => item.id)
  if (myItemIds.length === 0) {
    pendingRequests.value = []
    return
  }

  const { data, error } = await client
    .from('rentals')
    .select('*')
    .in('item_id', myItemIds)
    .order('created_at', { ascending: false })

  if (!error) {
    pendingRequests.value = data
  }
}

async function updateRequestStatus(id, newStatus) {
  const { error } = await client
    .from('rentals')
    .update({ status: newStatus })
    .eq('id', id)

  if (!error) {
    alert(`Zmieniono status rezerwacji na: ${newStatus}!`)
    await fetchRequests()
  } else {
    alert('Błąd aktualizacji: ' + error.message)
  }
}

// Inicjalizacja komponentu po otwarciu panelu
onMounted(async () => {
  await fetchMyItems() // Najpierw pobierz przedmioty użytkownika
  await fetchRequests() // Potem pobierz powiązane rezerwacje
})

// Jeśli usuniesz przedmiot z poziomu tego komponentu, odśwież listę lokalną
watch(() => props.allItems, async () => {
  await fetchMyItems()
  await fetchRequests()
}, { deep: true })
</script>