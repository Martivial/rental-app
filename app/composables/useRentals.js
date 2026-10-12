import { ref, computed } from 'vue'

export function useRentals() {
  const client = useSupabaseClient()
  
  const loadingRentals = ref(false)
  const incomingRentals = ref([])
  const myRentals = ref([])
  const acceptedRanges = ref([])

  // Pobieranie wypożyczeń dla panelu użytkownika
  async function fetchRentals(userId) {
    loadingRentals.value = true
    try {
      const { data: myItemsData } = await client.from('items').select('id').eq('user_id', userId)
      const myItemIds = (myItemsData || []).map(i => i.id)

      if (myItemIds.length > 0) {
        const { data: incoming } = await client
          .from('rentals')
          .select(`
            id, status, created_at, item_id, borrower_id, start_date, end_date,
            items (id, name, user_id),
            borrower:profiles!rentals_borrower_id_fkey (name, surname, phone)
          `)
          .in('item_id', myItemIds)
          .order('created_at', { ascending: false })

        incomingRentals.value = incoming || []
      } else {
        incomingRentals.value = []
      }

      const { data: mine } = await client
        .from('rentals')
        .select(`
          id, status, created_at, item_id, start_date, end_date,
          items (
            id, name, 
            profiles (name, phone)
          )
        `)
        .eq('borrower_id', userId)
        .order('created_at', { ascending: false })

      myRentals.value = mine || []

    } catch (err) {
      console.error('Błąd pobierania wypożyczeń:', err)
    } finally {
      loadingRentals.value = false
    }
  }

  // Zmiana statusu wypożyczenia (Akceptuj / Odrzuć / Wydaj)
// composables/useRentals.js

async function updateRentalStatus(rentalId, newStatus, userId) {
  try {
    // 1. Pobieramy dane rezerwacji
    const { data: rentalData, error: fetchError } = await client
      .from('rentals')
      .select('item_id, borrower_id, items(user_id, name)')
      .eq('id', rentalId)
      .single()

    if (fetchError) throw fetchError

    // 2. Aktualizujemy status w tabeli 'rentals'
    const { error: updateError } = await client
      .from('rentals')
      .update({ status: newStatus })
      .eq('id', rentalId)

    if (updateError) throw updateError

    // 3. Obsługa automatycznych wiadomości na czacie w zależności od statusu
    if (rentalData && (newStatus === 'accepted' || newStatus === 'rejected')) {
      const borrowerId = rentalData.borrower_id
      const ownerId = rentalData.items.user_id
      const itemName = rentalData.items.name
      const itemId = rentalData.item_id

      // Sprawdzamy, czy istnieje konwersacja
      let { data: convData, error: convError } = await client
        .from('conversations')
        .select('id')
        .eq('item_id', itemId)
        .or(`and(user1_id.eq.${ownerId},user2_id.eq.${borrowerId}),and(user1_id.eq.${borrowerId},user2_id.eq.${ownerId})`)
        .maybeSingle()

      // Jeśli nie istnieje, tworzymy nową
      if (!convData) {
        const { data: newConv, error: createConvError } = await client
          .from('conversations')
          .insert({
            item_id: itemId,
            user1_id: ownerId,
            user2_id: borrowerId
          })
          .select('id')
          .single()

        if (!createConvError && newConv) {
          convData = newConv
        }
      }

      // Przygotowujemy treść wiadomości w zależności od decyzji właściciela
      let messageContent = ''
      if (newStatus === 'accepted') {
        messageContent = `✅ Cześć! wypożyczenie przedmiotu: "${itemName}" zostało zaakceptowane. Możemy ustalić szczegóły odbioru!`
      } else if (newStatus === 'rejected') {
        messageContent = `❌ Cześć, wypożyczenie przedmiotu: "${itemName}" zostało odrzucone (termin jest niedostępny lub przedmiot jest w tym czasie zajęty).`
      }

      // Wysyłamy wiadomość do bazy, jeśli konwersacja istnieje
      if (convData?.id && messageContent) {
        await client.from('messages').insert({
          conversation_id: convData.id,
          sender_id: ownerId,
          content: messageContent
        })
      }
    }

    // 4. Odświeżamy listę rezerwacji
    await fetchRentals(userId)
    return true
  } catch (err) {
    alert("Błąd aktualizacji statusu: " + err.message)
    return false
  }
}
  // Pobieranie zablokowanych terminów dla konkretnego przedmiotu (kalendarz)
  async function fetchAcceptedRanges(itemId) {
    try {
      const { data } = await client
        .from('rentals')
        .select('start_date, end_date')
        .eq('item_id', itemId)
        .in('status', ['accepted', 'active']) // Tylko te stany blokują kalendarz

      if (data) {
        acceptedRanges.value = data.filter(r => r.start_date && r.end_date)
      }
    } catch (err) {
      console.error('Błąd pobierania terminów:', err)
    }
  }

  // Algorytm sprawdzający kolizje terminów
  function checkConflict(start, end) {
    const newStart = new Date(start).getTime()
    const newEnd = new Date(end).getTime()

    for (const range of acceptedRanges.value) {
      const existingStart = new Date(range.start_date).getTime()
      const existingEnd = new Date(range.end_date).getTime()

      if (newStart <= existingEnd && newEnd >= existingStart) {
        return range
      }
    }
    return null
  }

  // Wysłanie prośby o wypożyczenie przez użytkownika
  async function requestRental(itemId, borrowerId, startDate, endDate) {
    if (!startDate || !endDate) {
      throw new Error("Wybierz datę od oraz do!")
    }

    if (startDate > endDate) {
      throw new Error("Data początkowa nie może być późniejsza niż końcowa!")
    }

    const conflict = checkConflict(startDate, endDate)
    if (conflict) {
      throw new Error(`Ten termin koliduje z inną rezerwacją (od ${conflict.start_date} do ${conflict.end_date})!`)
    }

    const { error } = await client.from('rentals').insert({
      item_id: itemId,
      borrower_id: borrowerId,
      status: 'pending',
      start_date: startDate,
      end_date: endDate
    })

    if (error) throw error
    return true
  }

  const pendingRequestsCount = computed(() => {
    return incomingRentals.value.filter(r => r.status === 'pending').length
  })

  function getStatusText(status) {
    switch (status) {
      case 'pending': return 'Oczekuje na decyzję'
      case 'accepted': return 'Zaakceptowane'
      case 'rejected': return 'Odrzucone'
      case 'active': return 'W trakcie wypożyczenia'
      case 'completed': return 'Zakończone'
      default: return status
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'accepted': return 'bg-green-50 text-green-700 border border-green-200'
      case 'rejected': return 'bg-red-50 text-red-700 border border-red-200'
      case 'active': return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'completed': return 'bg-slate-100 text-slate-600 border border-slate-200'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  return {
    loadingRentals,
    incomingRentals,
    myRentals,
    acceptedRanges,
    pendingRequestsCount,
    fetchRentals,
    updateRentalStatus,
    fetchAcceptedRanges,
    checkConflict,
    requestRental,
    getStatusText,
    getStatusBadgeClass
  }
}