<template>
  <div class="fixed inset-0 flex items-end md:items-center justify-center z-[10000] p-0 md:p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl animate-slide-up">
      <div class="flex items-center gap-2 mb-2 text-amber-600">
        <span class="text-xl">📋</span>
        <h2 class="text-lg md:text-xl font-bold">Uzupełnij profil</h2>
      </div>
      <p class="text-xs text-slate-500 mb-4 leading-relaxed">
        Zanim dodasz pierwsze ogłoszenie, podaj swoje dane. Sąsiedzi potrzebują ich, aby wiedzieć, od kogo pożyczają i jak się skontaktować.
      </p>
      
      <div class="space-y-3">
        <div>
          <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Imię</label>
          <input v-model="profileData.name" placeholder="np. Jan" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div>
          <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nazwisko</label>
          <input v-model="profileData.surname" placeholder="np. Kowalski" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div>
          <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Numer telefonu</label>
          <input v-model="profileData.phone" type="tel" placeholder="np. 500 600 700" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        
        <div class="flex gap-3 pt-3">
          <button @click="saveProfileFirst" :disabled="isSavingProfile" class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold text-sm transition">
            {{ isSavingProfile ? 'Zapisywanie...' : 'Zapisz dane i kontynuuj' }}
          </button>
          <button @click="$emit('close')" class="px-5 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl font-bold text-sm text-slate-600 transition">Anuluj</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({ name: '', surname: '', phone: '' })
  },
  userId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])
const client = useSupabaseClient()

const isSavingProfile = ref(false)
const profileData = ref({
  name: props.initialData.name || '',
  surname: props.initialData.surname || '',
  phone: props.initialData.phone || ''
})

async function saveProfileFirst() {
  if (!profileData.value.name.trim() || !profileData.value.surname.trim() || !profileData.value.phone.trim()) {
    alert("Wszystkie pola muszą być uzupełnione!")
    return
  }

  isSavingProfile.value = true
  try {
    // Wysyłamy tylko czyste dane, aby nie naruszyć zasad RLS
    const { error } = await client
      .from('profiles')
      .upsert({
        id: props.userId,
        name: profileData.value.name.trim(),
        surname: profileData.value.surname.trim(),
        phone: profileData.value.phone.trim()
      })

    if (error) throw error
    
    emit('success')
  } catch (err) {
    alert("Błąd zapisu: " + err.message)
  } finally {
    isSavingProfile.value = false
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