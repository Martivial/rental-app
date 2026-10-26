<template>
  <div class="space-y-4">
    <div v-if="loadingProfile" class="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
      <div class="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      <span>Wczytywanie danych konta...</span>
    </div>

    <template v-else>
      <!-- Link do publicznego profilu -->
      <div class="bg-green-50/60 border border-green-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
        <div>
          <h4 class="font-bold text-xs text-green-900">Twój publiczny profil</h4>
          <p class="text-[11px] text-green-700/80 mt-0.5">Zobacz wizytówkę i ogłoszenia oczami innych.</p>
        </div>
        <NuxtLink 
          v-if="userId" 
          :to="`/profile/${userId}`" 
          target="_blank"
          class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <span>Zobacz</span>
          <ExternalLink :size="14" />
        </NuxtLink>
      </div>

      <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
        
        <!-- Email do logowania -->
        <div>
          <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email do logowania</label>
          <div class="flex gap-2">
            <input 
              v-model="emailInput" 
              type="email" 
              placeholder="twoj@email.com" 
              class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium text-slate-700"
            />
            <button 
              @click="handleUpdateEmail" 
              :disabled="isUpdatingEmail || emailInput === initialEmail"
              class="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white text-xs font-bold px-4 rounded-xl transition cursor-pointer shrink-0"
            >
              {{ isUpdatingEmail ? 'Zmienianie...' : 'Zmień email' }}
            </button>
          </div>
          <p class="text-[10px] text-slate-400 mt-1">Zmiana maila może wymagać potwierdzenia.</p>
        </div>

        <!-- Zmiana hasła -->
        <div class="pt-2 border-t border-slate-100">
          <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Zmiana hasła</label>
          <div class="space-y-2">
            <input 
              v-model="newPassword" 
              type="password" 
              placeholder="Nowe hasło (min. 6 znaków)" 
              class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium text-slate-700"
            />
            <input 
              v-model="confirmPassword" 
              type="password" 
              placeholder="Powtórz nowe hasło" 
              class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium text-slate-700"
            />
            <button 
              @click="handleUpdatePassword" 
              :disabled="isUpdatingPassword || !newPassword"
              class="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              {{ isUpdatingPassword ? 'Aktualizowanie hasła...' : 'Zmień hasło' }}
            </button>
          </div>
        </div>

        <hr class="border-slate-100 my-2" />

        <!-- Imię -->
        <div>
          <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Imię</label>
          <input v-model="profileData.name" placeholder="np. Jan" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium" />
        </div>

        <!-- Nazwisko -->
        <div>
          <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nazwisko</label>
          <input v-model="profileData.surname" placeholder="np. Kowalski" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium" />
        </div>

        <!-- Numer telefonu -->
        <div>
          <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Numer telefonu</label>
          
          <div class="flex gap-2">
            <input 
              v-model="phonePrefix" 
              @input="handlePrefixInput"
              type="text" 
              maxlength="5"
              placeholder="+48"
              class="w-20 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-bold text-slate-700 text-center tracking-wide"
            />

            <div class="relative flex-1">
              <input 
                v-model="rawPhoneNumber" 
                @input="handlePhoneInput"
                type="tel" 
                maxlength="11" 
                placeholder="223 222 322" 
                :class="phoneValidationError ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-green-500'"
                class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 text-sm font-bold text-slate-700 tracking-wide transition"
              />
              <span v-if="rawPhoneNumber && !phoneValidationError && rawPhoneNumber.replace(/\D/g, '').length === 9" class="absolute right-3 top-3.5 text-green-500 text-xs font-bold">
                ✓
              </span>
            </div>
          </div>

          <p v-if="phoneValidationError" class="text-red-500 text-[11px] font-semibold mt-1">
            {{ phoneValidationError }}
          </p>
        </div>
      </div>

      <button @click="saveProfileData" :disabled="isSaving" class="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg text-sm cursor-pointer">
        <Save :size="16" />
        <span>{{ isSaving ? 'Zapisywanie zmian...' : 'Zapisz dane profilu' }}</span>
      </button>
      
      <p v-if="saveSuccess" class="text-center text-xs text-green-600 font-semibold animate-pulse">
        Dane konta zostały pomyślnie zaktualizowane!
      </p>
      
      <p v-if="statusMessage" class="text-center text-xs font-semibold" :class="statusMessage.includes('błąd') || statusMessage.includes('różnią') ? 'text-red-500' : 'text-green-600'">
        {{ statusMessage }}
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Save, ExternalLink } from 'lucide-vue-next'
import { useProfile } from '@/composables/useProfile'

const props = defineProps(['userId'])
const emit = defineEmits(['profile-updated'])
const client = useSupabaseClient()

const { loadingProfile, isSaving, saveSuccess, profileData, fetchUserProfile, updateProfile } = useProfile()

const phonePrefix = ref('+48')
const rawPhoneNumber = ref('')
const phoneValidationError = ref('')

const emailInput = ref('')
const initialEmail = ref('')
const isUpdatingEmail = ref(false)

const newPassword = ref('')
const confirmPassword = ref('')
const isUpdatingPassword = ref(false)

const statusMessage = ref('')

function handlePrefixInput(e) {
  let val = e.target.value
  if (!val.startsWith('+')) {
    val = '+' + val.replace(/\D/g, '')
  } else {
    val = '+' + val.slice(1).replace(/\D/g, '')
  }
  phonePrefix.value = val
}

function handlePhoneInput(e) {
  let digitsOnly = e.target.value.replace(/\D/g, '')
  if (digitsOnly.length > 9) digitsOnly = digitsOnly.slice(0, 9)

  if (digitsOnly.length > 6) {
    rawPhoneNumber.value = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`
  } else if (digitsOnly.length > 3) {
    rawPhoneNumber.value = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`
  } else {
    rawPhoneNumber.value = digitsOnly
  }

  if (digitsOnly.length > 0 && digitsOnly.length < 9) {
    phoneValidationError.value = 'Numer telefonu powinien zawierać 9 cyfr.'
  } else {
    phoneValidationError.value = ''
  }
}

function parseIncomingPhone(fullPhone) {
  if (!fullPhone) return
  const parts = fullPhone.trim().split(' ')
  if (parts[0] && parts[0].startsWith('+')) {
    phonePrefix.value = parts[0]
    rawPhoneNumber.value = parts.slice(1).join(' ')
  } else {
    rawPhoneNumber.value = fullPhone
  }
}

async function handleUpdateEmail() {
  if (!emailInput.value || emailInput.value === initialEmail.value) return
  isUpdatingEmail.value = true
  statusMessage.value = ''

  try {
    const { error } = await client.auth.updateUser({ email: emailInput.value })
    if (error) throw error

    initialEmail.value = emailInput.value
    statusMessage.value = 'Email zaktualizowany! Sprawdź skrzynkę w celu potwierdzenia.'
  } catch (err) {
    statusMessage.value = 'Błąd zmiany maila: ' + err.message
  } finally {
    isUpdatingEmail.value = false
  }
}

async function handleUpdatePassword() {
  if (!newPassword.value) return
  if (newPassword.value.length < 6) {
    statusMessage.value = 'Hasło musi mieć co najmniej 6 znaków.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    statusMessage.value = 'Hasła się różnią!'
    return
  }

  isUpdatingPassword.value = true
  statusMessage.value = ''

  try {
    const { error } = await client.auth.updateUser({ password: newPassword.value })
    if (error) throw error

    newPassword.value = ''
    confirmPassword.value = ''
    statusMessage.value = 'Hasło zostało pomyślnie zmienione!'
  } catch (err) {
    statusMessage.value = 'Błąd zmiany hasła: ' + err.message
  } finally {
    isUpdatingPassword.value = false
  }
}

async function saveProfileData() {
  const cleanDigits = rawPhoneNumber.value.replace(/\D/g, '')
  if (cleanDigits.length !== 9) {
    phoneValidationError.value = 'Wprowadź poprawny 9-cyfrowy numer telefonu.'
    return
  }

  profileData.value.phone = `${phonePrefix.value} ${rawPhoneNumber.value}`

  await updateProfile(props.userId, () => {
    emit('profile-updated')
  })
}

onMounted(async () => {
  if (props.userId) {
    await fetchUserProfile(props.userId)
    if (profileData.value.phone) {
      parseIncomingPhone(profileData.value.phone)
    }
  }

  const { data: { session } } = await client.auth.getSession()
  if (session?.user?.email) {
    initialEmail.value = session.user.email
    emailInput.value = session.user.email
  }
})
</script>