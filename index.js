let app = new Vue({
  el: "#app",
  data: {
    isLoggedIn: false,
    client: null,
    appID: null,
    room: null,
    token: null,
    isError: false,
    localStream: null,
    remoteStream: null,
    mutedAudio: false,
    mutedVideo: false,
    remoteStreamIds: [],
  },

  mounted() {
    AgoraRTC.Logger.setLogLevel(4);
    AgoraRTC.checkSystemRequirements();
  },

  methods: {
    joinRoom() {
      this.initializeAgora();
    },

    initializeAgora() {
      this.client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
      this.client.init(
        this.appID, // Your APP ID from the agora dashboard.
        () => {
          console.log("AgoraRTC client initialized");
          this.joinChannel();
        },
        (err) => {
          console.log("AgoraRTC client init failed", err);
        }
      );
    },

    joinChannel() {
      console.log("Join Channel");
      this.client.join(
        this.token,
        this.room,
        null,
        (uid) => {
          console.log("User " + uid + " join channel successfully");

          // enable dual stream
          this.client.enableDualStream(
            () => console.log("Enable dual stream success!"),
            (e) => console.log(e)
          );

          this.isLoggedIn = true;
          this.client.setLowStreamParameter({
            bitrate: 500,
            framerate: 15,
            height: 480,
            width: 640,
          });
          this.createLocalStream();
          this.initializedAgoraListeners();
        },
        (err) => {
          console.log("Join channel failed", err);
          this.setErrorMessage();
        }
      );
    },

    initializedAgoraListeners() {
      //   Register event listeners
      this.client.on("stream-published", function (evt) {
        console.log("Publish local stream successfully");
        console.log(evt);
      });

      //subscribe remote stream
      this.client.on("stream-added", ({ stream }) => {
        console.log("New stream added: " + stream.getId());
        this.client.setRemoteVideoStreamType(stream, 1);
        this.client.subscribe(stream, function (err) {
          console.log("Subscribe stream failed", err);
        });
      });

      this.client.on("stream-subscribed", (evt) => {
        // Attach remote stream to the remote-video div
        this.remoteStream = evt.stream;
        let streamId = evt.stream.getId();

        // store ids of remote stream
        this.remoteStreamIds.push(streamId);

        // simulate a slight delay to make sure dom element is present.
        setTimeout(() => {
          console.log("just delaying");
          evt.stream.play("agora_remote_" + streamId);
          this.client.publish(evt.stream);
        }, 2000);
      });

      this.client.on("stream-removed", ({ stream }) => {
        // console.log(String(stream.getId()));
        stream.stop();
        stream.close();

        this.removeStream(stream.getId());
      });

      this.client.on("peer-online", (evt) => {
        console.log("peer-online", evt.uid);
      });

      this.client.on("peer-leave", (evt) => {
        var uid = evt.uid;
        var reason = evt.reason;
        console.log("remote user left ", uid, "reason: ", reason);

        this.removeStream(uid);
      });

      this.client.on("stream-unpublished", (evt) => {
        console.log(evt);
      });
    },

    createLocalStream() {
      this.localStream = AgoraRTC.createStream({
        audio: true,
        video: true,
      });

      this.localStream.setVideoProfile("480p_1");
      // Initialize the local stream
      this.localStream.init(
        () => {
          // Play the local stream
          this.localStream.play("local-video");
          // Publish the local stream
          this.client.publish(this.localStream, (err) => {
            console.log("publish local stream", err);
          });
        },
        (err) => {
          console.log(err);
        }
      );
    },

    removeStream(streamId) {
      console.log("removeStream was executed");
      let removedStreamIndex = this.remoteStreamIds.findIndex(
        (id) => id === streamId
      );
      // remove streamId from list and clear black screen from DOM
      this.remoteStreamIds.splice(removedStreamIndex, 1);
    },

    endCall() {
      this.localStream.stop();
      this.localStream.close();

      // unpublish local stream
      this.client.unpublish(this.localStream, function (err) {
        console.log(err);
        //……
      });

      // unsubscribe from remote stream if there is a remote user
      // on  the channel
      if (this.remoteStream) {
        this.client.unsubscribe(this.remoteStream, function (err) {
          console.log(err);
          //……
        });
      }

      // Leave the channel
      this.client.leave(
        () => {
          console.log("Leave channel successfully");
          this.isLoggedIn = false;
        },
        (err) => {
          console.log("Leave channel failed");
        }
      );
    },

    setErrorMessage() {
      this.isError = true;
      setTimeout(() => {
        this.isError = false;
      }, 2000);
    },

    handleAudioToggle() {
      if (this.mutedAudio) {
        this.localStream.enableAudio();
        this.mutedAudio = false;
      } else {
        this.localStream.disableAudio();
        this.mutedAudio = true;
      }
    },

    handleVideoToggle() {
      if (this.mutedVideo) {
        this.localStream.enableVideo();
        this.mutedVideo = false;
      } else {
        this.localStream.disableVideo();
        this.mutedVideo = true;
      }
    },
  },
});
