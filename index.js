let app = new Vue({
  el: "#app",
  data: {
    isLoggedIn: false,
    client: null,
    name: null,
    room: null,
    password: null,
    isError: false,
    localStream: null,
    mutedAudio: false,
    mutedVideo: false,
  },

  created() {
    this.initializeAgora();
  },

  methods: {
    initializeAgora() {
      this.client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
      this.client.init(
        "396e04646ef344e5a6c69304f56f59c0",
        function () {
          console.log("AgoraRTC client initialized");
        },
        function (err) {
          console.log("AgoraRTC client init failed", err);
        }
      );
    },

    joinRoom() {
      console.log("Join Room");
      this.client.join(
        this.password,
        this.room,
        null,
        (uid) => {
          console.log("User " + uid + " join channel successfully");
          this.isLoggedIn = true;
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
        this.client.subscribe(stream, function (err) {
          console.log("Subscribe stream failed", err);
        });
      });

      this.client.on("stream-subscribed", (evt) => {
        // Attach remote stream to the remote-video div
        evt.stream.play("remote-video");
        this.client.publish(evt.stream);
      });

      this.client.on("stream-removed", ({ stream }) => {
        console.log(String(stream.getId()));
        stream.close();
      });

      this.client.on("peer-online", (evt) => {
        console.log("peer-online", evt.uid);
      });

      this.client.on("peer-leave", (evt) => {
        var uid = evt.uid;
        var reason = evt.reason;
        console.log("remote user left ", uid, "reason: ", reason);
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

    endCall() {
      this.localStream.close();
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
