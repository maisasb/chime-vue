<script setup>
import { computed, defineProps, defineEmits } from "vue";

const props = defineProps({
  hostConfig: { type: Object, default: undefined },
});
const emit = defineEmits(["toggleVideo", "toggleAudio", "endVideoCall"]);

const showVideo = computed(() => {
  return props.hostConfig.isVideoOff ? "off" : "on";
});
const showMic = computed(() => {
  return props.hostConfig.isMuted ? "off" : "on";
});
</script>

<template>
  <nav class="player-footer">
    <button @click="emit('toggleAudio')">Toggle audio {{ showMic }}</button>
    <button @click="emit('toggleVideo')">Toggle video {{ showVideo }}</button>
    <button class="player-footer__end" @click="emit('endVideoCall')">
      Encerrar chamada
    </button>
  </nav>
</template>

<style scoped>
.player-footer {
  width: 100%;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}
.player-footer__end {
  border-radius: 16px;
  background: red;
  padding: 16px 24px;
  display: flex;
  gap: 16px;
  color: #fff;
}
</style>
