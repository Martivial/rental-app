<template>
  <div 
    v-if="url" 
    class="fixed inset-0 z-[10010] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 cursor-zoom-out" 
    @click="$emit('close')"
  >
    <button 
      @click.stop="$emit('close')" 
      class="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition border border-white/20 backdrop-blur-md"
    >
      ✕
    </button>

    <img 
      :src="url" 
      class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in duration-200" 
      @click.stop
    />
  </div>
</template>

<script setup>
defineProps(['url'])
defineEmits(['close'])
</script>