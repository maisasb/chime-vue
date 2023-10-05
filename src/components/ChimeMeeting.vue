<script setup>
import ChimeWrapper from "../wrappers/ChimeWrapper";
import { onMounted, ref, defineProps } from "vue";
import ChimePlaceholder from "./ChimePlaceholder.vue";
import ChimePlayer from "./ChimePlayer.vue";
import ChimeFooter from "./ChimeFooter.vue";

const props = defineProps({
  meeting: { type: Object, required: true },
  attendee: { type: Object, required: true },
});

const audioVideoConfig = ref({});
const shouldShowPlaceholder = ref(true);
const videoCall = ref(null);
const subscribers = ref([]);
const mediaStream = ref(null);

onMounted(() => {
  checkAudioVideoPermission();
  videoCall.value = new ChimeWrapper(
    updateAudioVideoConfiguration,
    updateParticipants
  );
  videoCall.value.start(props.meeting, props.attendee);
});

const getHostConfig = () => {
  const hostTile = videoCall.value?.getHostTile();
  return getSubscriberConfig(hostTile?.boundAttendeeId) || {};
};
const getSubscriberConfig = (subscriber) => {
  return audioVideoConfig.value[subscriber];
};
const getSubscriberTileId = (subscriber) => {
  return getSubscriberConfig(subscriber)?.tileId;
};

const leaveMeeting = async () => {
  await videoCall.value.stop();
  endMediaStream();
};
const updateParticipants = (data) => {
  subscribers.value = data.subscribers;
};
const updateAudioVideoConfiguration = (config) => {
  audioVideoConfig.value = config;
};
const toggleAudio = () => {
  videoCall.value.toggleHostAudio();
};
const toggleVideo = () => {
  videoCall.value.toggleHostVideo();
};
const checkAudioVideoPermission = () => {
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: true })
    .then((response) => {
      /* eslint-disable no-console */
      console.info("Permission garanted: ", response);
      mediaStream.value = response;
      shouldShowPlaceholder.value = false;
    })
    .catch((error) => {
      /* eslint-disable no-console */
      console.error("Permission error: ", error);
      shouldShowPlaceholder.value = true;
    });
};
const endMediaStream = () => {
  mediaStream.value.getTracks().forEach((track) => track.stop());
};
const bindAudio = (htmlElement) => {
  videoCall.value.bindAudio(htmlElement);
};
const bindVideo = (tileId, htmlElement) => {
  videoCall.value.bindVideo(tileId, htmlElement);
};
const unbindVideo = (tileId) => {
  videoCall.value.unbindVideo(tileId);
};
</script>

<template>
  <div class="chime-video">
    <ChimePlaceholder v-if="shouldShowPlaceholder" />
    <section v-else class="chime-video__container">
      <div class="chime-video__players">
        <ChimePlayer
          v-for="subscriber in subscribers"
          :key="subscriber"
          :tile-id="getSubscriberTileId(subscriber)"
          :config="getSubscriberConfig(subscriber)"
          :bind-audio-function="bindAudio"
          :bind-video-function="bindVideo"
          :unbind-video-function="unbindVideo"
        />
      </div>
      <ChimeFooter
        :host-config="getHostConfig()"
        @toggle-audio="toggleAudio"
        @toggle-video="toggleVideo"
        @end-video-call="leaveMeeting"
      />
    </section>
  </div>
</template>
