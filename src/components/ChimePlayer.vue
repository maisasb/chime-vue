<script setup>
import { onMounted, ref, watch, defineProps } from "vue";

const props = defineProps({
  tileId: { type: Number, default: undefined },
  bindAudioFunction: { type: Function, required: true },
  bindVideoFunction: { type: Function, required: true },
  unbindVideoFunction: { type: Function, required: true },
  config: { type: Object, default: () => ({}) },
});

const audio = ref(null);
const video = ref(null);

watch(
  () => props.tileId,
  (newTileId, oldTileId) => {
    props.unbindVideoFunction(oldTileId);
    bind(newTileId);
  }
);

onMounted(() => {
  bind();
});

const bind = (tileId) => {
  props.bindAudioFunction(audio.value);
  props.bindVideoFunction(tileId, video.value);
};
</script>

<template>
  <div ref="player" class="player-container">
    <audio v-show="false" ref="audio" />
    <video :id="tileId" ref="video" class="player-container__video"></video>

    <div class="player-container__info">
      {{ config.isMuted ? "Audio off" : "Audio on" }}
    </div>
  </div>
</template>
