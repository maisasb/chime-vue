/* eslint-disable @typescript-eslint/ban-types */
import * as ChimeSDK from "amazon-chime-sdk-js";

interface SubscriberConfig {
  isVideoOff?: boolean;
  isMuted?: boolean;
  tileId?: number | null;
  isLocalTile?: boolean;
}

interface AudioVideoConfig {
  [key: string]: SubscriberConfig;
}

class VideoCall
  implements ChimeSDK.DeviceChangeObserver, ChimeSDK.AudioVideoObserver
{
  private meetingSession: ChimeSDK.MeetingSession | undefined;
  private audioVideo: ChimeSDK.AudioVideoFacade | undefined;
  isVideoOff = false;
  subscribers: string[] = [];
  audioVideoConfig: AudioVideoConfig = {};
  callbackUpdateAudioVideoConfig: Function;
  callbackSubscribersUpdate: Function;

  constructor(
    callbackAudioVideoConfig: Function,
    callbackSubscribersUpdate: Function
  ) {
    this.callbackUpdateAudioVideoConfig = callbackAudioVideoConfig;
    this.callbackSubscribersUpdate = callbackSubscribersUpdate;
  }
  async start(meeting: ChimeSDK.MeetingSession, attendee: ChimeSDK.Attendee) {
    const configuration = new ChimeSDK.MeetingSessionConfiguration(
      meeting,
      attendee
    );
    const chimeLogger = new ChimeSDK.ConsoleLogger(
      "ChimeLogger",
      ChimeSDK.LogLevel.INFO
    );
    const deviceController = new ChimeSDK.DefaultDeviceController(chimeLogger);

    this.meetingSession = new ChimeSDK.DefaultMeetingSession(
      configuration,
      chimeLogger,
      deviceController
    );

    this.audioVideo = this.meetingSession.audioVideo;
    const videoInputs = await this.audioVideo.listVideoInputDevices();
    await this.audioVideo.startVideoInput(videoInputs[0].deviceId);

    const audioInputs = await this.audioVideo.listAudioInputDevices();
    await this.audioVideo.startAudioInput(audioInputs[0].deviceId);

    const audioOutputs = await this.audioVideo.listAudioOutputDevices();
    await this.audioVideo.chooseAudioOutput(audioOutputs[0]?.deviceId);

    this.audioVideo.start();

    this.audioVideo.startLocalVideoTile();

    this.subscribeParticipants();

    this.audioVideo.addObserver(this);

    this.audioVideo.addDeviceChangeObserver(this);
  }

  async stop() {
    if (this.audioVideo) {
      this.audioVideo.removeDeviceChangeObserver(this);
      this.audioVideo.removeObserver(this);
      await this.audioVideo.stopVideoInput();
      await this.audioVideo.stopAudioInput();
      this.audioVideo.stopLocalVideoTile();
      await this.audioVideo.chooseAudioOutput(null);
      this.audioVideo.removeLocalVideoTile();
      this.audioVideo.stop();
    }
  }

  toggleHostAudio() {
    if (this.audioVideo) {
      if (this.audioVideo.realtimeIsLocalAudioMuted()) {
        this.audioVideo.realtimeUnmuteLocalAudio();
      } else {
        this.audioVideo.realtimeMuteLocalAudio();
      }
    }
  }

  toggleHostVideo() {
    if (this.audioVideo) {
      if (this.isVideoOff) {
        this.audioVideo.startLocalVideoTile();
      } else {
        this.audioVideo.stopLocalVideoTile();
      }
      this.isVideoOff = !this.isVideoOff;
    }
  }

  subscribeParticipants() {
    this.audioVideo?.realtimeSubscribeToAttendeeIdPresence(
      (presentAttendeeId, present) => {
        if (present) {
          if (!this.subscribers.includes(presentAttendeeId)) {
            this.subscribers.push(presentAttendeeId);
            this.subscribeVolume(presentAttendeeId);
          }
        } else {
          this.subscribers = this.subscribers.filter(
            (id) => id !== presentAttendeeId
          );
          this.unsubscribeVolume(presentAttendeeId);
        }

        this.callbackSubscribersUpdate({
          subscribers: this.subscribers,
        });
      }
    );
  }

  getSubscriberTile(subscriberId: string) {
    if (!this.audioVideo) return null;
    const tiles = this.audioVideo.getAllVideoTiles();
    const tile = tiles.find((tile) => {
      const tileState = tile.state();
      return tileState.boundAttendeeId === subscriberId;
    });
    return tile?.state();
  }

  getHostTile() {
    if (!this.audioVideo) return null;
    const tiles = this.audioVideo.getAllVideoTiles();
    return tiles.find((tile) => tile.state().localTile)?.state();
  }

  subscribeVolume(subscriberId: string) {
    this.audioVideo?.realtimeSubscribeToVolumeIndicator(
      subscriberId,
      (_, __, muted) => {
        if (muted !== null) {
          this.addAudioVideoConfiguration(subscriberId, {
            isMuted: !!muted,
          });
          this.callbackUpdateAudioVideoConfig(this.audioVideoConfig);
        }
      }
    );
  }

  unsubscribeVolume(subscriberId: string) {
    this.audioVideo?.realtimeUnsubscribeFromVolumeIndicator(subscriberId);
  }

  bindAudio(htmlElement: HTMLAudioElement) {
    if (!htmlElement) return;
    this.audioVideo?.bindAudioElement(htmlElement);
  }

  bindVideo(tileId: number, htmlElement: HTMLVideoElement) {
    if (!htmlElement || !tileId) return;
    this.audioVideo?.bindVideoElement(tileId, htmlElement);
  }

  unbindVideo(tileId: number) {
    this.audioVideo?.unbindVideoElement(tileId, false);
  }

  addAudioVideoConfiguration(subscriberId: string, config: SubscriberConfig) {
    if (!this.audioVideoConfig[subscriberId]) {
      this.audioVideoConfig[subscriberId] = {};
    }
    this.audioVideoConfig[subscriberId] = {
      ...this.audioVideoConfig[subscriberId],
      ...config,
    };
  }

  //AudioVideoObserver
  audioVideoDidStop() {
    this.audioVideo?.stopAudioInput();
  }

  videoTileDidUpdate(tileState: ChimeSDK.VideoTileState) {
    if (!tileState.boundAttendeeId) {
      return;
    }
    this.addAudioVideoConfiguration(tileState.boundAttendeeId, {
      isVideoOff: !tileState.active,
      tileId: tileState.tileId,
      isLocalTile: tileState.localTile,
    });

    this.callbackUpdateAudioVideoConfig(this.audioVideoConfig);
  }
  videoTileWasRemoved(tileId: number) {
    const subscriberTile = Object.keys(this.audioVideoConfig).find((key) => {
      if (this.audioVideoConfig[key].tileId === tileId) {
        return key;
      }
      return false;
    });

    if (!subscriberTile) return;

    this.addAudioVideoConfiguration(subscriberTile, {
      isVideoOff: true,
    });

    this.callbackUpdateAudioVideoConfig(this.audioVideoConfig);
  }

  //DeviceChangeObserver
  audioInputsChanged(freshAudioInputDeviceList?: MediaDeviceInfo[]) {
    if (freshAudioInputDeviceList) {
      this.audioVideo?.startAudioInput(freshAudioInputDeviceList[0].deviceId);
    }
  }
}
export default VideoCall;
