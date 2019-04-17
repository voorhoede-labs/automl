(function() {
    const form = document.querySelector('[data-form]');
    const imageOriginal = document.querySelector('[data-image-original]');
    const imageOriginalTemplate = document.querySelector('[data-image-original-template]');
    const imageTransformed = document.querySelector('[data-image-transformed]');
    const imageTransformedTemplate = document.querySelector('[data-image-transformed-template]');

    form.addEventListener('submit', onFormSubmit);

    function onFormSubmit(e) {
        e.preventDefault();

        if (!e.target.checkValidity()) {
            return;
        }

        const file = e.target.image.files[0];
        const maxSize = parseInt(e.target.maxSize.value);
        const quality = parseFloat(e.target.quality.value);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (readerEvent) => {
            const image = new Image();
            image.src = readerEvent.target.result;

            image.onload = () => {
                // render original
                imageOriginal.innerHTML = imageOriginalTemplate.innerHTML
                    .replace('{{imageSrc}}', image.src)
                    .replace('{{imageWidth}}', image.width)
                    .replace('{{imageHeight}}', image.height)
                    .replace('{{imageQuality}}', 1)
                    .replace('{{imageFilesize}}', file.size);
                imageOriginal.classList.add('enhanced');

                smartcrop.crop(imageOriginal.querySelector('img'), { width: maxSize, height: maxSize }).then((result) => {
                    console.log(result);

                    let canvas = document.createElement('canvas');

                    const cropWidth = result.topCrop.width;
                    const cropHeight = result.topCrop.height;

                    canvas.width = maxSize;
                    canvas.height = maxSize;

                    canvas.getContext('2d').drawImage(
                        image,
                        result.topCrop.x, result.topCrop.y, // Start at x pixels from the left and y from the top of the image (crop),
                        cropWidth, cropHeight,              // "Get" a w * h area from the source image (crop),
                        0, 0,                               // Place the result at 0, 0 in the canvas,
                        maxSize, maxSize                    // size the cropped image
                    );

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);

                    // render transformed
                    imageTransformed.innerHTML = imageTransformedTemplate.innerHTML
                        .replace('{{imageSrc}}', dataUrl)
                        .replace('{{imageWidth}}', maxSize)
                        .replace('{{imageHeight}}', maxSize)
                        .replace('{{imageQuality}}', quality)
                        .replace('{{imageFilesize}}', dataUrl.length / (3/4)); // size +-
                    imageTransformed.classList.add('enhanced');
                });
            };
        }

    }
})();
