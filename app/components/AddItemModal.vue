<!-- components/AddItemModal.vue -->
<template>
  <div class="fixed inset-0 flex items-end md:items-center justify-center z-[9999] p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm">
    <div class="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl animate-slide-up">
      <h2 class="text-xl md:text-2xl font-bold mb-4 text-slate-800">Dodaj nowe ogłoszenie</h2>
      <div class="space-y-4">
        <input v-model="newItem.name" placeholder="Nazwa narzędzia (np. Wiertarka Udarowa)" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        <input v-model="newItem.category" placeholder="Kategoria (np. Elektronarzędzia)" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        <textarea v-model="newItem.description" placeholder="Opisz stan narzędzia..." rows="3" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"></textarea>
        
        <div class="flex gap-3 pt-2">
          <button @click="saveItem" :disabled="isSaving" class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold text-sm transition">
            {{ isSaving ? 'Publikowanie...' : 'Opublikuj' }}
          </button>
          <button @click="$emit('close')" class="px-6 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl font-bold text-sm text-slate-600 transition">Anuluj</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  coords: {
    type: Object,
    required: true // Oczekuje { lat: X, lng: Y }
  },
  userId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'saved'])
const client = useSupabaseClient()
const isSaving = ref(false)

const newItem = ref({
  name: '',
  category: '',
  description: ''
})

async function saveItem() {
  if (!newItem.value.name.trim()) {
    alert("Nazwa narzędzia jest wymagana!")
    return
  }

  isSaving.value = true
  try {
    const itemToSave = {
      name: newItem.value.name.trim(),
      category: newItem.value.category.trim() || '',
      description: newItem.value.description.trim() || '',
      lat: parseFloat(props.coords.lat),
      lng: parseFloat(props.coords.lng),
      user_id: props.userId
    }

    const { error } = await client.from('items').insert([itemToSave])
    if (error) throw error

    emit('saved')
  } catch (err) {
    alert("Błąd dodawania ogłoszenia: " + err.message)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.25s ease-out forwards;
}
</style>