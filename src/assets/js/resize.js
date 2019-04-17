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

                // resize
                let canvas = document.createElement('canvas'),
                    width = image.width,
                    height = image.height;
                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);

                // minify
                const dataUrl = canvas.toDataURL('image/jpeg', quality);

                // render transformed
                imageTransformed.innerHTML = imageTransformedTemplate.innerHTML
                    .replace('{{imageSrc}}', dataUrl)
                    .replace('{{imageWidth}}', width)
                    .replace('{{imageHeight}}', height)
                    .replace('{{imageQuality}}', quality)
                    .replace('{{imageFilesize}}', dataUrl.length / (3/4)); // size +-
                imageTransformed.classList.add('enhanced');
            };
        };
    }
})();
