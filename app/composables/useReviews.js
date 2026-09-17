export const useReviews = (profileId) => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  
  const reviews = ref([])             
  const averageRating = ref(0)        
  const userReviewRating = ref(5)    
  const userReviewComment = ref('')   
  const submittingReview = ref(false)

  // 1. Pobieranie opinii
  async function fetchReviews() {
    const { data, error } = await client
      .from('reviews')
      .select(`
        *,
        profiles:reviews_reviewer_id_fkey (name, surname)
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Błąd pobierania opinii:', error.message)
      return
    }
    
    reviews.value = data || []

    if (reviews.value.length > 0) {
      const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
      averageRating.value = (sum / reviews.value.length).toFixed(1)
    } else { 
      averageRating.value = 0 
    }

    if (user.value) {
      const existingReview = reviews.value.find(r => r.reviewer_id === user.value.id)
      if (existingReview) {
        userReviewRating.value = existingReview.rating
        userReviewComment.value = existingReview.comment || ''
      }
    }
  }

  // 2. Wysyłanie opinii z bezpiecznym pobieraniem sesji
  async function submitReview(userId) {
    const { data: { session } } = await client.auth.getSession()
    const activeUserId = userId || session?.user?.id || user.value?.id

    if (!activeUserId) {
      alert("Musisz być zalogowany, aby dodać opinię!")
      return
    }
    
    if (activeUserId === profileId) {
      alert("Ne możesz wystawić opinii samemu sobie!")
      return
    }

    submittingReview.value = true

    try {
      const { error } = await client
        .from('reviews')
        .upsert({
          reviewer_id: activeUserId,
          profile_id: profileId,
          rating: userReviewRating.value,
          comment: userReviewComment.value.trim() || null
        }, {
          onConflict: 'reviewer_id, profile_id'
        })

      if (error) throw error

      await fetchReviews() 
      alert("Twoja opinia została zapisana!")
    } catch (err) {
      console.error('Błąd zapisu opinii:', err.message)
      alert("Wystąpił błąd podczas zapisywania opinii.")
    } finally {
      submittingReview.value = false
    }
  }

  // KLUCZOWO: Zwracamy obiekt ze wszystkimi zmiennymi i funkcjami
  return {
    reviews,
    averageRating,
    userReviewRating,
    userReviewComment,
    submittingReview,
    fetchReviews,
    submitReview
  }
}