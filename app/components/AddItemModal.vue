<template>
  <div class="fixed inset-0 flex items-end md:items-center justify-center z-[9999] p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm" @click.stop>
    <div class="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl animate-slide-up">
      <h2 class="text-xl md:text-2xl font-bold mb-4 text-slate-800">
        {{ isEdit ? 'Edytuj ogłoszenie' : 'Dodaj nowe ogłoszenie' }}
      </h2>
      <div class="space-y-4">
        <input v-model="newItem.name" placeholder="Nazwa narzędzia" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        
        <select v-model="newItem.category" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm text-slate-600">
          <option value="" disabled>Wybierz kategorię...</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <textarea v-model="newItem.description" placeholder="Opisz stan narzędzia..." rows="3" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"></textarea>
        
        <div class="flex gap-3 pt-2">
          <button @click="saveItem" :disabled="isSaving" class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold text-sm transition">
            {{ isSaving ? 'Zapisywanie...' : (isEdit ? 'Zapisz zmiany' : 'Opublikuj') }}
          </button>
          <button @click="$emit('close')" class="px-6 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl font-bold text-sm text-slate-600 transition">Anuluj</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['coords', 'userId', 'editItem']) // editItem to cały obiekt ogłoszenia
const emit = defineEmits(['close', 'saved'])
const client = useSupabaseClient()
const isSaving = ref(false)
const isEdit = computed(() => !!props.editItem)

const categories = ['Elektronika', 'Ogród', 'Budowlane', 'AGD', 'Sport', 'Inne']
const newItem = ref({
  name: props.editItem?.name || '',
  category: props.editItem?.category || '',
  description: props.editItem?.description || ''
})

async function saveItem() {
  if (!newItem.value.name.trim() || !newItem.value.category) return alert("Nazwa i kategoria są wymagane!")

  isSaving.value = true
  try {
    if (isEdit.value) {
      const { error } = await client.from('items').update({
        name: newItem.value.name.trim(),
        category: newItem.value.category,
        description: newItem.value.description.trim()
      }).eq('id', props.editItem.id)
      if (error) throw error
    } else {
      const { error } = await client.from('items').insert([{
        name: newItem.value.name.trim(),
        category: newItem.value.category,
        description: newItem.value.description.trim(),
        lat: parseFloat(props.coords.lat),
        lng: parseFloat(props.coords.lng),
        user_id: props.userId
      }])
      if (error) throw error
    }
    emit('saved')
  } catch (err) { alert("Błąd: " + err.message) } finally { isSaving.value = false }
}
</script>