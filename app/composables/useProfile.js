import { ref } from 'vue'

export function useProfile() {
  const client = useSupabaseClient()
  const loadingProfile = ref(false)
  const isSaving = ref(false)
  const saveSuccess = ref(false)
  
  const profileData = ref({ name: '', surname: '', phone: '' })

  async function fetchUserProfile(userId) {
    loadingProfile.value = true
    try {
      const { data, error } = await client
        .from('profiles')
        .select('name, surname, phone')
        .eq('id', userId)
        .maybeSingle()
        
      if (!error && data) {
        profileData.value.name = data.name || ''
        profileData.value.surname = data.surname || ''
        profileData.value.phone = data.phone === 'EMPTY' ? '' : (data.phone || '')
      }
    } catch (err) {
      console.error('Błąd pobierania profilu:', err.message)
    } finally {
      loadingProfile.value = false
    }
  }

  async function updateProfile(userId, onSuccess) {
    if (!profileData.value.name.trim() || !profileData.value.surname.trim() || !profileData.value.phone.trim()) {
      alert("Wszystkie pola profilu muszą być wypełnione!")
      return false
    }
    
    isSaving.value = true
    try {
      const { error } = await client.from('profiles').upsert({
        id: userId,
        name: profileData.value.name.trim(),
        surname: profileData.value.surname.trim(),
        phone: profileData.value.phone.trim(),
        updated_at: new Date()
      })
      
      if (error) throw error
      
      saveSuccess.value = true
      if (onSuccess) onSuccess()
      
      setTimeout(() => { 
        saveSuccess.value = false 
      }, 4000)
      
      return true
    } catch (err) {
      alert("Błąd zapisu profilu: " + err.message)
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    loadingProfile,
    isSaving,
    saveSuccess,
    profileData,
    fetchUserProfile,
    updateProfile
  }
}