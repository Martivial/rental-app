<template>
  <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
    
    <!-- Nagłówek sekcji -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div>
        <h3 class="font-bold text-slate-900 text-base">Opinie o użytkowniku</h3>
        <p class="text-xs text-slate-400 mt-0.5">Co mówią inni sąsiedzi</p>
      </div>
      <div class="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-2xl text-amber-700 font-black text-sm">
        <span>★</span>
        <span>{{ averageRating }}</span>
        <span class="text-[10px] font-bold text-amber-500/80 ml-0.5">({{ reviews.length }})</span>
      </div>
    </div>

    <!-- Lista opinii -->
    <div class="space-y-4 max-h-[350px] overflow-y-auto pr-1">
      <div v-if="reviews.length === 0" class="text-center py-8 text-slate-400 text-xs font-medium">
        Brak opinii. Bądź pierwszy, który wystawi ocenę!
      </div>

      <div v-for="review in reviews" :key="review.id" class="bg-slate-50/70 border border-slate-100 p-4 rounded-2xl space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center text-xs">
              {{ review.profiles?.name?.charAt(0).toUpperCase() || 'U' }}
            </div>
            <div>
              <span class="font-bold text-slate-800 text-xs block">
                {{ review.profiles?.name || 'Użytkownik' }} {{ review.profiles?.surname || '' }}
              </span>
              <span class="text-[10px] text-slate-400 block">
                {{ new Date(review.created_at).toLocaleDateString('pl-PL') }}
              </span>
            </div>
          </div>
          <!-- Gwiazdki opinii -->
          <div class="flex text-amber-400 text-xs">
            <span v-for="n in 5" :key="n">
              {{ n <= review.rating ? '★' : '☆' }}
            </span>
          </div>
        </div>
        <p v-if="review.comment" class="text-xs text-slate-600 leading-relaxed pl-10">
          {{ review.comment }}
        </p>
      </div>
    </div>

    <!-- Sekcja dodawania / edycji opinii -->
    <div class="pt-4 border-t border-slate-100">
      <div v-if="!isLoggedIn" class="bg-slate-50 p-4 rounded-2xl text-center border border-slate-200/60">
        <p class="text-xs text-slate-500 font-medium mb-2">Musisz się zalogować, aby dodać opinię.</p>
      </div>

      <div v-else-if="currentUserId === profileId" class="bg-amber-50/60 border border-amber-200/60 p-4 rounded-2xl text-center">
        <p class="text-xs text-amber-800 font-medium">Nie możesz wystawić opinii samemu sobie.</p>
      </div>

      <div v-else class="space-y-3 bg-slate-50/60 border border-slate-200/60 p-4 rounded-2xl">
        <h4 class="font-bold text-slate-800 text-xs uppercase tracking-wider">
          Twoja opinia
        </h4>

        <!-- Wybór gwiazdek -->
        <div class="flex items-center gap-1">
          <button 
            v-for="star in 5" 
            :key="star" 
            @click="userReviewRating = star"
            type="button"
            class="text-xl focus:outline-none transition hover:scale-110"
            :class="star <= userReviewRating ? 'text-amber-400' : 'text-slate-300'"
          >
            ★
          </button>
          <span class="text-xs font-bold text-slate-600 ml-2">({{ userReviewRating }}/5)</span>
        </div>

        <!-- Komentarz -->
        <textarea 
          v-model="userReviewComment" 
          placeholder="Napisz kilka słów o współpracy..." 
          rows="2"
          class="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-green-500 focus:outline-none text-slate-800 resize-none"
        ></textarea>

        <!-- Przycisk zapisu -->
        <button 
          @click="handleReviewSubmit"
          :disabled="submittingReview"
          class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span v-if="submittingReview" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ submittingReview ? 'Zapisywanie...' : 'Zapisz opinię' }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'

const props = defineProps({
  profileId: { type: String, required: true },
  currentUserId: { type: String, default: null },
  isLoggedIn: { type: Boolean, default: false }
})

const emit = defineEmits(['rating-updated'])

const {
  reviews,
  averageRating,
  userReviewRating,
  userReviewComment,
  submittingReview,
  fetchReviews,
  submitReview
} = useReviews(props.profileId)

// Przekazuj średnią ocenę do rodzica za każdym razem, gdy się zmieni
watch(averageRating, (newVal) => {
  emit('rating-updated', newVal)
})

async function handleReviewSubmit() {
  await submitReview(props.currentUserId)
  // Emitujemy aktualną średnią po zapisaniu
  emit('rating-updated', averageRating.value)
}

onMounted(async () => {
  await fetchReviews()
  emit('rating-updated', averageRating.value)
})
</script>