
<template>
  <div 
    v-if="item" 
    class="fixed inset-0 flex items-end md:items-center justify-center z-[10005] p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm" 
    @click="$emit('close')"
  >
    <div class="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl animate-slide-up overflow-hidden flex flex-col" @click.stop>
      
      <!-- Górny pasek ze zdjęciem/placeholderem -->
      <div class="h-44 bg-slate-100 relative flex items-center justify-center text-slate-300 text-5xl border-b border-slate-200">
        📷
        <button @click="$emit('close')" class="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition">✕</button>
      </div>

      <!-- Zawartość Modalu -->
      <div class="p-6 space-y-4">
        <div>
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-xl font-black text-slate-800 leading-tight">{{ item.name }}</h2>
            <span class="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
              📍 {{ distanceText }}
            </span>
          </div>
          <span v-if="item.category" class="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold inline-block mt-2 uppercase tracking-wider border border-green-100">
            {{ item.category }}
          </span>
        </div>

        <!-- Opis przedmiotu -->
        <div v-if="item.description" class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opis przedmiotu</h4>
          <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{{ item.description }}</p>
        </div>

        <!-- Sekcja Kontaktu i Właściciela -->
        <div class="border-t border-slate-100 pt-3">
          <template v-if="isLoggedIn">
            <div class="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 mb-3">
              <div class="w-10 h-10 bg-green-100 text-green-700 font-bold rounded-full flex items-center justify-center text-sm">
                {{ item.profiles?.name?.charAt(0).toUpperCase() || 'S' }}
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Właściciel / Sąsiad</span>
                <span class="font-bold text-slate-800 text-base">
                  {{ item.profiles?.name || 'Imię nieznane' }} {{ item.profiles?.surname || '' }}
                </span>
              </div>
            </div>

            <!-- Przycisk bezpośredniego połączenia -->
            <a 
              v-if="item.profiles?.phone && item.profiles.phone !== 'EMPTY'" 
              :href="'tel:' + item.profiles.phone" 
              class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 transition active:scale-[0.98] shadow-lg shadow-green-600/10 text-base"
            >
              <span>📞</span>
              <span>Zadzwoń do sąsiada: {{ item.profiles.phone }}</span>
            </a>
            <div v-else class="text-center text-slate-400 italic text-xs py-2 bg-slate-50 rounded-xl border">
              Właściciel nie podał numeru telefonu.
            </div>
          </template>

          <!-- Widok dla niezalogowanego (gościa) -->
          <template v-else>
            <div @click="$emit('trigger-login')" class="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-center gap-3 cursor-pointer transition">
              <span class="text-2xl">🔒</span>
              <div class="flex-1">
                <p class="font-bold text-sm">Dane kontaktowe są zablokowane</p>
                <p class="text-xs text-amber-700 mt-0.5">Zaloguj się lub utwórz darmowe konto, aby zobaczyć dane właściciela.</p>
              </div>
            </div>
          </template>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    default: null
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  distanceText: {
    type: String,
    default: 'Lokalizacja nieznana'
  }
})

defineEmits(['close', 'trigger-login'])
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