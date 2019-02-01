
function generatePreview(baseImageSrc, rawImageSize, beeElements) {

    let canvas = document.createElement("canvas");
    canvas.width = rawImageSize[0];
    canvas.height = rawImageSize[1];
    const context = canvas.getContext("2d");
    let base_image = new Image();
    base_image.src = 'png/' + baseImageSrc;
    context.drawImage(base_image, 0, 0);

    const beeAxisLen = 100;
    const arrowWidth = 10;
    const arrowHeight = 20;
    const centerRadius = 5;
    const buttRadius = 25;

    for (const beeElement of beeElements) {

        const objectType = parseInt(beeElement.dataset.type);
        const posX = parseInt(beeElement.dataset.globalpos_x);
        const posY = parseInt(beeElement.dataset.globalpos_y);

        context.save();
        if(objectType === 0) {
            //draw a yellow arrow for bee body object
            context.beginPath();
            context.lineWidth = 3;
            context.strokeStyle = '#FFFF00FF';
            context.translate(posX, posY);
            context.rotate(beeElement.dataset.angle*Math.PI/180);
            context.moveTo(0,-beeAxisLen/2);
            context.lineTo(0, beeAxisLen/2);
            context.stroke();
            context.moveTo(0, -beeAxisLen/2);
            context.lineTo(-arrowWidth, -beeAxisLen/2 + arrowHeight);
            context.stroke();
            context.moveTo(0, -beeAxisLen/2);
            context.lineTo(arrowWidth, -beeAxisLen/2 + arrowHeight);
            context.stroke();
            context.beginPath();
            context.arc(0, 0, centerRadius, 0, 2 * Math.PI);
            context.fillStyle = '#FFFF00FF';
            context.fill();
            context.stroke();
        }
        else if(objectType === 1){
            //draw an orange circle for bee butt object
            context.beginPath();
            context.lineWidth = 3;
            context.strokeStyle = '#FFA500';
            context.arc(posX, posY, buttRadius, 0, 2 * Math.PI);
            context.stroke();
        }
        context.restore();
    }

    const dataURL = canvas.toDataURL();
    const newCsvFilename = 'preview_' + baseImageSrc;
    $.ajax({
        type: 'POST',
        data: {filename:newCsvFilename, data:dataURL},
        url: 'savePreview'
    });

}