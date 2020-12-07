let app = new Vue({
  el: "#app",
  data: {
    message: "Hello Vue!",
    client: null,
  },

  mounted() {
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

      this.client.join(
        "006396e04646ef344e5a6c69304f56f59c0IAB1UxKZ6t9v8exa0PtrA0FO6CuwkH+moFN67mMJOEpe5HavCmIAAAAAEAAWal0mdajOXwEAAQB0qM5f",
        "video_chat",
        null,
        (uid) => {
          console.log("User " + uid + " join channel successfully");
          this.createLocalStream();
        },
        function (err) {
          console.log("Join channel failed", err);
        }
      );

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

      this.client.on("stream-subscribed", ({ stream: remoteStream }) => {
        // Attach remote stream to the remote-video div
        remoteStream.play("remote-video");
        this.client.publish(remoteStream);
      });

      this.client.on("stream-removed", ({ stream }) => {
        console.log(String(stream.getId()));
        stream.close();
      });

      this.client.on("peer", ({ stream }) => {
        stream.close();
      });
    },

    createLocalStream() {
      let localStream = AgoraRTC.createStream({
        audio: true,
        video: true,
      });

      // Initialize the local stream
      localStream.init(
        () => {
          // Play the local stream
          localStream.play("local-video");
          // Publish the local stream
          this.client.publish(localStream, (err) => {
            console.log("publish local stream", err);
          });
        },
        (err) => {
          console.log(err);
        }
      );
    },

    leaveChannel() {
      this.client.leave(
        function () {
          console.log("Leave channel successfully");
        },
        function (err) {
          console.log("Leave channel failed");
        }
      );
    },
  },
});
