import { ref, computed } from 'vue'

export function useItems() {
  const client = useSupabaseClient()
  
  const loadingItems = ref(false)
  const items = ref([])
  const localMyItems = ref([])
  const mapCenter = ref(null)
  const searchQuery = ref('')
  const selectedCategory = ref('')
  const addressQuery = ref('')

  // Pobieranie wszystkich ogłoszeń (na mapę i listę główną)
  async function loadItems() {
    loadingItems.value = true
    try {
      const { data, error } = await client.from('items').select('*, profiles(*)')
      if (error) throw error
      items.value = data || []
    } catch (err) {
      console.error('Błąd pobierania items:', err)
      items.value = []
    } finally {
      loadingItems.value = false
    }
  }

  // Pobieranie ogłoszeń konkretnego użytkownika (do panelu)
  async function fetchUserItems(userId) {
    loadingItems.value = true
    try {
      const { data, error } = await client.from('items').select('*').eq('user_id', userId)
      if (error) throw error
      localMyItems.value = data || []
    } catch (err) {
      console.error('Błąd pobierania ogłoszeń użytkownika:', err.message)
    } finally {
      loadingItems.value = false
    }
  }

  // Filtrowanie przedmiotów (wyszukiwarka + kategorie)
  const filteredItems = computed(() => {
    if (!items.value) return []
    return items.value.filter(item => {
      const s = searchQuery.value.toLowerCase()
      const matchesSearch = item.name.toLowerCase().includes(s)
      const matchesCategory = selectedCategory.value === '' || item.category === selectedCategory.value
      return matchesSearch && matchesCategory
    })
  })

  // Filtrowanie moich przedmiotów
  const myItemsOnly = computed((userId) => {
    if (!items.value || !userId) return []
    return items.value.filter(item => String(item.user_id).trim() === String(userId).trim())
  })

  // Formatowanie odległości od użytkownika
  function formatDistance(item) {
    if (!mapCenter.value || !item.lat || !item.lng) return 'Lokalizacja nieznana'

    const R = 6371000
    const lat1 = mapCenter.value.lat * Math.PI / 180, lat2 = item.lat * Math.PI / 180
    const deltaLat = (item.lat - mapCenter.value.lat) * Math.PI / 180
    const deltaLng = (item.lng - mapCenter.value.lng) * Math.PI / 180
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
    const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))

    return distance < 1000 ? `${Math.round(distance)}m stąd` : `${(distance / 1000).toFixed(1)}km stąd`
  }

  // Automatyczna geolokalizacja
  function initAutomaticLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        mapCenter.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      }, null, { timeout: 5000 })
    }
  }

  function goToMyLocation() {
    navigator.geolocation.getCurrentPosition((pos) => {
      mapCenter.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    })
  }

  // Wyszukiwanie lokalizacji po adresie (OpenStreetMap Nominatim)
  async function searchLocationByAddress() {
    if (!addressQuery.value.trim()) return

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery.value)}`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        mapCenter.value = {
          lat: parseFloat(lat),
          lng: parseFloat(lon)
        }
      } else {
        alert('Nie znaleziono takiego adresu lub miejscowości.')
      }
    } catch (err) {
      console.error('Błąd wyszukiwania adresu:', err)
      alert('Wystąpił błąd podczas wyszukiwania lokalizacji.')
    }
  }
  // composables/useItems.js (dopisz tę funkcję do pliku)
async function fetchItemSingle(itemId) {
  try {
    const { data, error } = await client
      .from('items')
      .select('*, profiles (name, surname, phone)')
      .eq('id', itemId)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Błąd pobierania szczegółów ogłoszenia:', err.message)
    return null
  }
}

  function getImageUrl(path) {
    const { data } = client.storage.from('items').getPublicUrl(path)
    return data.publicUrl
  }

  return {
    loadingItems,
    items,
    localMyItems,
    mapCenter,
    searchQuery,
    selectedCategory,
    addressQuery,
    filteredItems,
    myItemsOnly,
    loadItems,
    fetchUserItems,
    formatDistance,
    initAutomaticLocation,
    goToMyLocation,
    searchLocationByAddress,
    getImageUrl,
    fetchItemSingle
  }
}