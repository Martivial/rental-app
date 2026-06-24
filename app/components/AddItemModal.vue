<template>
  <div class="fixed inset-0 flex items-end md:items-center justify-center z-[9999] p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm" @click.stop>
    <div class="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl animate-slide-up">
      <h2 class="text-xl md:text-2xl font-bold mb-4 text-slate-800">
        {{ isEdit ? 'Edytuj ogłoszenie' : 'Dodaj nowe ogłoszenie' }}
      </h2>
      
      <div class="space-y-4">
        <input v-model="newItem.name" placeholder="Nazwa narzędzia" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-500 ml-1">Zdjęcie (max 2MB):</label>
          <input type="file" @change="handleFileChange" accept="image/*" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
        </div>

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
const props = defineProps(['coords', 'userId', 'editItem'])
const emit = defineEmits(['close', 'saved'])
const client = useSupabaseClient()

const isSaving = ref(false)
const file = ref(null)
const MAX_SIZE_MB = 2
const isEdit = computed(() => !!props.editItem)
const categories = ['Elektronika', 'Ogród', 'Budowlane', 'AGD', 'Sport', 'Inne']

const newItem = ref({
  name: props.editItem?.name || '',
  category: props.editItem?.category || '',
  description: props.editItem?.description || ''
})

function handleFileChange(event) {
  const selectedFile = event.target.files[0]
  if (!selectedFile) return
  if (!selectedFile.type.startsWith('image/')) {
    alert("Wybierz plik graficzny.")
    event.target.value = ''
    return
  }
  if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
    alert(`Plik za duży! Maksimum ${MAX_SIZE_MB}MB.`)
    event.target.value = ''
    return
  }
  file.value = selectedFile
}

async function saveItem() {
  if (!newItem.value.name.trim() || !newItem.value.category) return alert("Nazwa i kategoria są wymagane!")
  isSaving.value = true
  try {
    let imagePath = props.editItem?.image_path || null
    if (file.value) {
      const fileName = `${crypto.randomUUID()}.${file.value.name.split('.').pop()}`
      const { data, error: uploadError } = await client.storage.from('items').upload(fileName, file.value)
      if (uploadError) throw uploadError
      imagePath = data.path
    }
    const payload = { name: newItem.value.name.trim(), category: newItem.value.category, description: newItem.value.description.trim(), image_path: imagePath }
    if (isEdit.value) {
      const { error } = await client.from('items').update(payload).eq('id', props.editItem.id)
      if (error) throw error
    } else {
      payload.lat = parseFloat(props.coords.lat); payload.lng = parseFloat(props.coords.lng); payload.user_id = props.userId
      const { error } = await client.from('items').insert([payload])
      if (error) throw error
    }
    emit('saved')
  } catch (err) { alert("Błąd: " + err.message) } finally { isSaving.value = false }
}
</script>