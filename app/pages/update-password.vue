<template>
  <div class="h-screen flex items-center justify-center bg-slate-100 p-4">
    <div class="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
      <h2 class="text-xl font-bold mb-6 text-slate-800">Ustaw nowe hasło</h2>
      
      <div v-if="loading" class="text-center text-slate-500">Ładowanie...</div>
      
      <div v-else class="space-y-4">
        <input v-model="newPassword" type="password" placeholder="Nowe hasło" 
               class="w-full p-3 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-500" />
        
        <button @click="updatePassword" class="w-full bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700 transition">
          Zapisz hasło
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const client = useSupabaseClient()
const newPassword = ref('')
const loading = ref(true)

// Sprawdzamy sesję przy wejściu na stronę
onMounted(async () => {
  const { data: { session } } = await client.auth.getSession()
  
  if (!session) {
    alert('Link wygasł lub jest nieprawidłowy. Spróbuj zresetować hasło ponownie.')
    navigateTo('/')
  } else {
    loading.value = false
  }
})

async function updatePassword() {
  if (newPassword.value.length < 6) return alert('Hasło musi mieć min. 6 znaków.')

  const { error } = await client.auth.updateUser({
    password: newPassword.value
  })

  if (error) {
    alert('Błąd: ' + error.message)
  } else {
    alert('Hasło zmienione pomyślnie!')
    navigateTo('/')
  }
}
</script>