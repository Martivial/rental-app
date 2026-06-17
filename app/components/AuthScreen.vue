<template>
  <div class="h-screen w-full flex items-center justify-center bg-slate-100 p-4 font-sans">
    <div class="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
      
      <div class="flex flex-col items-center mb-8">
        <div class="bg-green-600 p-3 rounded-2xl text-white text-2xl mb-2">🛠️</div>
        <h2 class="text-2xl font-bold text-slate-800">
          {{ isForgotPassword ? 'Reset hasła' : 'Sąsiedzka Pożyczalnia' }}
        </h2>
        <p class="text-sm text-slate-400 mt-1 text-center">
          {{ isForgotPassword ? 'Podaj e-mail, wyślemy instrukcję.' : 'Zaloguj się lub utwórz konto' }}
        </p>
      </div>

      <div v-if="message" 
           :class="messageType === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'" 
           class="p-4 rounded-2xl mb-4 text-sm font-medium text-center relative">
        {{ message }}
        <button @click="message = ''" class="absolute top-2 right-3 font-bold opacity-50 hover:opacity-100">
          ×
        </button>
      </div>

      <div v-if="isForgotPassword" class="space-y-4">
        <input v-model="authEmail" type="email" placeholder="Twój adres e-mail" 
               class="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl focus:border-green-500 outline-none transition" />
        <button @click="resetPassword" class="w-full bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700 transition">
          Wyślij instrukcję
        </button>
        <button @click="isForgotPassword = false" class="w-full text-slate-400 text-xs font-bold underline">
          Wróć do logowania
        </button>
      </div>

      <div v-else class="space-y-4">
        <div>
          <label class="text-xs font-bold text-slate-400 uppercase ml-1">Adres E-mail</label>
          <input v-model="authEmail" type="email" placeholder="twoj@email.com" 
                 class="w-full mt-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl focus:border-green-500 outline-none transition" />
        </div>

        <div>
          <div class="flex justify-between items-end">
            <label class="text-xs font-bold text-slate-400 uppercase ml-1">Hasło</label>
            <button @click="isForgotPassword = true" class="text-[10px] font-bold text-green-600 hover:underline">Nie pamiętasz hasła?</button>
          </div>
          <input v-model="authPassword" type="password" placeholder="••••••••" 
                 class="w-full mt-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl focus:border-green-500 outline-none transition" />
        </div>

        <div class="flex gap-2 pt-2">
          <button @click="login" class="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700 transition active:scale-95">Zaloguj</button>
          <button @click="register" class="flex-1 bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold hover:bg-slate-200 transition active:scale-95">Rejestracja</button>
        </div>

        <div class="relative flex py-2 items-center">
          <div class="flex-grow border-t border-slate-200"></div>
          <span class="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase">Lub</span>
          <div class="flex-grow border-t border-slate-200"></div>
        </div>

        <button @click="loginWithGoogle" type="button" class="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-2xl hover:bg-slate-50 transition active:scale-95 shadow-sm">
          <svg class="w-5 h-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.3 9.1 3.4l6.8-6.8C35.7 2.6 30.2 0 24 0 14.8 0 6.9 5.2 2.8 13.1l7.9 6.1C12.8 13.2 18 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9.4h12.6c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 7-10.4 7-17.9z"/><path fill="#FBBC05" d="M10.7 28.7c-1.3-3.9-1.3-8.2 0-12.1l-7.9-6.1C.4 16.5 0 20.2 0 24c0 3.8.4 7.5 2.8 10.6l7.9-5.9z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.7l-7.7-6c-2.1 1.4-4.8 2.3-8.2 2.3-6.1 0-11.3-4.1-13.1-9.7l-7.9 6.1C6.9 42.8 14.8 48 24 48z"/></svg>
          Zaloguj przez Google
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const client = useSupabaseClient()
const authEmail = ref('')
const authPassword = ref('')
const isForgotPassword = ref(false)
const message = ref('')
const messageType = ref('success')

// Komunikat wisi, dopóki nie zostanie wyczyszczony przyciskiem lub nową akcją
function setMessage(text, type = 'success') {
  message.value = text
  messageType.value = type
}

async function resetPassword() {
  if (!authEmail.value) return setMessage('Wpisz adres e-mail!', 'error')
  
  const { error } = await client.auth.resetPasswordForEmail(authEmail.value, {
    redirectTo: `${window.location.origin}/update-password`,
  })

  if (error) setMessage(error.message, 'error')
  else setMessage('Sprawdź e-mail, aby zresetować hasło.')
}

async function loginWithGoogle() {
  await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
}

async function register() {
  if (!authEmail.value || !authPassword.value) return setMessage('Wpisz email i hasło!', 'error')

  const { data: existingUser } = await client.from('profiles').select('email').eq('email', authEmail.value).single()
  if (existingUser) return setMessage('Konto o tym adresie już istnieje.', 'error')

  const { error } = await client.auth.signUp({ email: authEmail.value, password: authPassword.value })
  if (error) setMessage(error.message, 'error')
  else setMessage('Konto utworzone! Sprawdź e-mail i kliknij link potwierdzający.')
}

async function login() {
  if (!authEmail.value || !authPassword.value) return setMessage('Wpisz email i hasło!', 'error')
  
  const { error } = await client.auth.signInWithPassword({ email: authEmail.value, password: authPassword.value })
  
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      setMessage('Błędny e-mail lub hasło.', 'error')
    } else if (error.message.includes('Email not confirmed')) {
      setMessage('Konto nieaktywne. Potwierdź adres e-mail w skrzynce.', 'error')
    } else {
      setMessage('Błąd: ' + error.message, 'error')
    }
  } else {
    setMessage('Zalogowano pomyślnie!', 'success')
  }
}
</script>