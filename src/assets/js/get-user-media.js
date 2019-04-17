(function() {
  if (hasGetUserMedia()) {
    useGetUserMedia();
  } else {
    alert('getUserMedia() is not supported by your browser');
  }

  function hasGetUserMedia() {
    return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  function useGetUserMedia() {
    const captureVideoButton = document.querySelector('[data-capture-video]');
    const screenshotButton = document.querySelector('[data-screenshot-button]');
    const videoElement = document.querySelector('[data-video-input]');
    const canvasElement = document.querySelector('[data-canvas]');
    const imageElement = document.querySelector('[data-screenshot-image]');
    const flipCameraButton = document.querySelector('[data-screenshot-flip]');
    let useRearCamera = true;

    captureVideoButton.addEventListener('click', captureVideo);
    screenshotButton.addEventListener('click', takeScreenshot);
    flipCameraButton.addEventListener('click', flipCamera);

    function captureVideo() {
      const constraints = {
        video: {
          facingMode: useRearCamera ? 'environment' : 'user'
        },
        audio: false,
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(onUserMediaSuccess).catch(onUserMediaError);
    }

    function onUserMediaSuccess(stream) {

      // enable flip camera button if supported and if multiple cameras available
      navigator.mediaDevices.enumerateDevices()
        .then(devices => devices.filter(device => device.kind === 'videoinput'))
        .then(videoDevices => {
          const supports = navigator.mediaDevices.getSupportedConstraints();
          if(supports['facingMode'] === true && videoDevices.length > 1) {
            flipCameraButton.disabled = false;
          }
        });

      screenshotButton.disabled = false;
      screenshotButton.disabled = false;
      videoElement.srcObject = stream;
    }

    function onUserMediaError(error) {
      console.error('Error: ', error);
    }

    function takeScreenshot() {
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      canvasElement.getContext('2d').drawImage(videoElement, 0, 0);

      const image = new Image();
      image.src = canvasElement.toDataURL('image/webp'); // Non supporting browsers will fall back to image/png

      image.onload = () => {
        cropImage(image);
      }
    }

    function cropImage(img) {
      smartcrop.crop(img, {width: 250, height: 250}).then((result) => {

        const cropWidth = result.topCrop.width;
        const cropHeight = result.topCrop.height;

        canvasElement.width = 250;
        canvasElement.height = 250;

        canvasElement.getContext('2d').drawImage(
          img,
          result.topCrop.x, result.topCrop.y, // Start at x pixels from the left and y from the top of the image (crop),
          cropWidth, cropHeight,              // "Get" a w * h area from the source image (crop),
          0, 0,                               // Place the result at 0, 0 in the canvas,
          250, 250                            // size the cropped image
        );

        const dataURL = canvasElement.toDataURL('image/jpeg', .7);
        imageElement.src = dataURL;

        uploadImage(dataURL)
      })
    }

    function uploadImage(dataURL) {
      const callAutoMl = firebase.functions().httpsCallable('callAutoML');
      callAutoMl({ img: dataURL.split(',')[1] })
        .then(response => {
          console.log(response)
        })
        .catch(e => {
          console.error(e)
        });
    }

    function flipCamera() {
      videoElement.pause();
      videoElement.srcObject = null;
      useRearCamera = !useRearCamera;
      captureVideo();
    }
  }
})();
