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
    const qualityInput = document.querySelector('[data-quality]');
    const maxSizeInput = document.querySelector('[data-max-size]');
    const predictionElement = document.querySelector('[data-prediction]');
    const predictionTemplate = document.querySelector('[data-prediction-template]');
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
      const quality = parseFloat(qualityInput.value);
      const maxSize = parseFloat(maxSizeInput.value);
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      canvasElement.getContext('2d').drawImage(videoElement, 0, 0);

      const image = new Image();
      image.src = canvasElement.toDataURL('image/webp'); // Non supporting browsers will fall back to image/png

      image.onload = () => {
        cropImage(image, maxSize, quality);
      }
    }

    function cropImage(img, maxSize, quality) {
      const cropWidth = 200;
      const cropHeight = 200;

      canvasElement.width = maxSize;
      canvasElement.height = maxSize;

      const horizontalCenter = (img.width / 2) - (cropWidth / 2);
      const verticalCenter = (img.height / 2) - (cropHeight / 2);

      canvasElement.getContext('2d').drawImage(
        img,
        horizontalCenter, verticalCenter,   // Start at x pixels from the left and y from the top of the image (crop),
        cropWidth, cropHeight,              // "Get" a w * h area from the source image (crop),
        0, 0,                               // Place the result at 0, 0 in the canvas,
        maxSize, maxSize                    // size the cropped image
      );

      const dataURL = canvasElement.toDataURL('image/jpeg', quality);
      imageElement.src = dataURL;

      uploadImage(dataURL)
    }

    function uploadImage(dataURL) {
      const callAutoMl = firebase.functions().httpsCallable('callAutoML');
      callAutoMl({ img: dataURL.split(',')[1] })
        .then(response => {
          if (response.data.length && response.data[0].payload.length) {
            const prediction = response.data[0].payload[0].displayName;
            const score = parseInt(response.data[0].payload[0].classification.score * 100);

            if (prediction === 'None_of_the_above') {
              predictionElement.innerHTML = 'I don\'t think that\'s a challenge, I\'m ' + score + '% certain';
            } else if (prediction === 'multiple') {
              predictionElement.innerHTML = 'Are you trying to fool me with multiple challenges?!, I\'m ' + score + '% certain';
            } else {
              predictionElement.innerHTML = predictionTemplate.innerHTML
                .replace('{{prediction}}', prediction)
                .replace('{{score}}', score);
            }

            showToastMessage()
          } else {
            throw 'no prediction';
          }
        })
        .catch(e => {
          console.error(e);
          predictionElement.innerHTML = 'I don\'t think that\'s a challenge';
          showToastMessage();
        });
    }

    function flipCamera() {
      videoElement.pause();
      videoElement.srcObject = null;
      useRearCamera = !useRearCamera;
      captureVideo();
    }

    function showToastMessage() {
      predictionElement.classList.add('active');

      setTimeout(() => {
        predictionElement.classList.remove('active')
      }, 5000);
    }
  }
})();
