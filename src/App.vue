<script setup>
import { computed, onMounted, ref } from "vue";
import ChimeMeeting from "./components/ChimeMeeting";

const meeting = ref(null);
const attendee = ref(null);

const showMeeting = computed(() => meeting.value && attendee.value);

onMounted(() => {
  meeting.value = {
    //enter meeting value
  };

  attendee.value = {
    //enter attendee value
  };
});
</script>

<template>
  <ChimeMeeting v-if="showMeeting" :meeting="meeting" :attendee="attendee" />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
