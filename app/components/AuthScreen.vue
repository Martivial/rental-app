<template>
  <div class="h-screen w-full flex items-center justify-center bg-slate-100 p-4 font-sans">
    <div class="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
      <div class="flex flex-col items-center mb-8">
        <div class="bg-green-600 p-3 rounded-2xl text-white text-2xl mb-2">🛠️</div>
        <h2 class="text-2xl font-bold text-slate-800">Sąsiedzka Pożyczalnia</h2>
        <p class="text-sm text-slate-400 mt-1">Zaloguj się lub utwórz konto</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="text-xs font-bold text-slate-400 uppercase ml-1">Adres E-mail</label>
          <input v-model="authEmail" type="email" placeholder="twoj@email.com" 
                 class="w-full mt-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl focus:border-green-500 outline-none transition" />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-400 uppercase ml-1">Hasło</label>
          <input v-model="authPassword" type="password" placeholder="••••••••" 
                 class="w-full mt-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl focus:border-green-500 outline-none transition" />
        </div>

        <div class="flex gap-2 pt-2">
          <button @click="login" 
                  class="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700 transition active:scale-95">
            Zaloguj
          </button>
          <button @click="register" 
                  class="flex-1 bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold hover:bg-slate-200 transition active:scale-95">
            Rejestracja
          </button>
        </div>

        <div class="relative flex py-2 items-center">
          <div class="flex-grow border-t border-slate-200"></div>
          <span class="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase">Lub szybko</span>
          <div class="flex-grow border-t border-slate-200"></div>
        </div>

        <button @click="loginWithGoogle" type="button"
                class="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-2xl hover:bg-slate-50 transition active:scale-95 shadow-sm">
          <img src="https://www.svgrepo.com/show/355037/google.svg" class="w-5 h-5" alt="Google" />
          Zaloguj przez Google
        </button>

        <button @click="loginWithMagicLink" 
                class="w-full border-2 border-green-600 text-green-600 py-3 rounded-2xl font-bold hover:bg-green-50 transition active:scale-95">
          Wyślij Magic Link na e-mail ✉️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const client = useSupabaseClient()

const authEmail = ref('')
const authPassword = ref('')

// LOGOWANIE GOOGLE
async function loginWithGoogle() {
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin, // Po udanym zalogowaniu wróć na stronę główną
    }
  })

  if (error) {
    alert('Błąd logowania Google: ' + error.message)
  }
}

// REJESTRACJA
async function register() {
  if (!authEmail.value || !authPassword.value) return alert('Wpisz email i hasło!')
  
  const { error } = await client.auth.signUp({
    email: authEmail.value,
    password: authPassword.value,
  })

  if (error) alert('Błąd rejestracji: ' + error.message)
  else alert('Konto utworzone! Jeśli Supabase wymaga potwierdzenia, sprawdź skrzynkę e-mail.')
}

// LOGOWANIE
async function login() {
  if (!authEmail.value || !authPassword.value) return alert('Wpisz email i hasło!')

  const { error } = await client.auth.signInWithPassword({
    email: authEmail.value,
    password: authPassword.value,
  })

  if (error) alert('Błąd logowania: ' + error.message)
}

// MAGIC LINK
async function loginWithMagicLink() {
  if (!authEmail.value) return alert('Wpisz najpierw adres e-mail!')

  const { error } = await client.auth.signInWithOtp({
    email: authEmail.value,
    options: {
      emailRedirectTo: window.location.origin,
    }
  })

  if (error) alert('Błąd: ' + error.message)
  else alert('Link do logowania wysłany! Sprawdź skrzynkę e-mail.')
}
</script>