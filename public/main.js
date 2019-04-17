const image = document.querySelector('[data-img-perdicted]');
const perdictionText = document.querySelector('[data-prediction-text]');
const card = document.querySelector('[data-card]');
const statusText = document.querySelector('[data-status]');
const weatherSummary = document.querySelector('[data-weather-summary]');
const cloudUpload = document.querySelector('[data-cloud-upload]');
const fileSelect = document.querySelector('[data-file-select]');
const progressBarEl = document.querySelector('[data-progressbar]');

function clearPrediction() {
    image.innerHTML = '';
    card.style.display = "none";
    [weatherSummary, statusText, perdictionText]
        .forEach(text => text.innerText = '')
}

function displayPrediction(data) {
    card.style.display = "flex";
    statusText.innerText = 'Got a prediction!'
    perdictionText.innerText = `${data.displayName}: ${(data.classification.score * 100).toFixed(2)}%`;
    showProgressBar(false);
}

function createGrayScaledImage(img) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  ctx.filter = "grayscale(100)";
  ctx.drawImage(img,
                0, 0, img.width, img.height,
                0, 0, img.width, img.height);

  const greyImage = canvas.toDataURL().split(',')[1];
}

function displayImage(file) {
    card.style.display = "flex";
    let img = document.createElement("img");
    let reader = new FileReader();

    img.file = file;
    image.appendChild(img);

    // use the selected image as img src to show in the card
    reader.onload = (function(imgDiv) {
        return function(e) { imgDiv.src = e.target.result; };
    })(img);

    reader.readAsDataURL(file);
}

function showProgressBar(showEl) {
    showEl ? progressBarEl.classList.add('show') : progressBarEl.classList.remove('show');
}

window.addEventListener('DOMContentLoaded', () => {
    fileSelect.addEventListener('click', () => {
        cloudUpload.click()
    });

    cloudUpload.addEventListener('change', e => {
        let localFile = e.target.files[0];
        const reader = new FileReader();

        clearPrediction();
        showProgressBar(true);
        displayImage(localFile);

        if(localFile) {
          statusText.innerText = 'Uploading image...'
        }

        reader.onload = () => {
          let dataURL = reader.result.split(',')[1];
          var callAutoML = firebase.functions().httpsCallable('callAutoML');

          callAutoML({ img: dataURL }).then((result) => {
            return result.data[0].payload[0];

          }).then(autoMLResults => {
            return displayPrediction(autoMLResults)
          });
        };

        reader.readAsDataURL(localFile);
    });
});
