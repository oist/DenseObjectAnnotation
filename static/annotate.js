$( function() {

    // The detailed image corresponds to 25% of the smaller side of the original image
    const ZOOM_LEVEL = 0.25;

    let rawImageSize;
    let cx, cy, imageScaleRatio;

    const dropDown = $('#dropdown');
    const draggableLens = $("#draggable-lens");
    const previewImage = $("#preview-image");
    const detailImage = $("#detail-image");
    const infosText = $("#infos-textarea");

    const newObjectTemplates = {};
    const objectCanRotate = {};

    initObjectsTemplates();

    draggableLens.draggable({
        drag:refreshViewport,
        stop:refreshViewport,
        containment: "#preview-image"
    });

    $("#preview-button").click( function() {
            const curFrameName = dropDown.find('option:selected').text();
            generatePreview(curFrameName + '.png', rawImageSize, detailImage.children());
        }
    );

    function initObjectsTemplates() {

        $("#new-objects-templates-placeholder").load('object-templates.html', function() {
            const newObjectTemplatesNode = $(this).children(':first').unwrap();
            newObjectTemplatesNode.children().each(function () {
                const newObjectTemplate = $(this);
                newObjectTemplate.draggable({
                    containment:"#detail-image",
                    stop:newObjectTemplateDragEnd
                });
                const objectType = newObjectTemplate.data('type');
                objectCanRotate[objectType] = (newObjectTemplate.find("#rotate-handle").length === 1);
                newObjectTemplates[objectType] = newObjectTemplate;
            });
            initImageList();
        });
    }

    function initImageList() {
        $.ajax({
            type: 'GET',
            url: 'listFiles',
            success: function (results) {
                $('>option', dropDown).remove();

                for (const res of results) {
                    const index = parseInt(res.replace(/[^0-9\.]/g, ''));
                    dropDown.append($('<option/>').val(index).text(res));
                }
                dropDown.change(function() {
                    loadFrame($(this).find('option:selected').text());
                });

                loadFrame(results[0]);
            }
        });
    }

    function saveAll()
    {
        dropDown.prop("disabled", true);
        let csvData = "";
        for (const objectRootElement of detailImage.children()) {
            csvData +=  objectRootElement.dataset.globalpos_x + ',' +
                        objectRootElement.dataset.globalpos_y + ',' +
                        objectRootElement.dataset.type + ','+
                        objectRootElement.dataset.angle + '\n';
        }
        const curFrameName = dropDown.find('option:selected').text();
        const curCsvFilename = curFrameName + '.txt';

        $.ajax({
            type: 'POST',
            data: {filename:curCsvFilename, message:csvData},
            url: 'saveData',
            complete: function () {
                dropDown.prop("disabled", false);
            }
        });
    }

    function loadFrame(frameName) {
        const imageFilename = frameName + '.png';
        $.ajax({
            type: 'GET',
            url: 'getImageSize',
            data: {
                frameName: imageFilename
            },
            success: function (res) {
                rawImageSize = [res.width, res.height];

                const imgWidth = previewImage.width();
                const imgHeight = res.height*imgWidth/res.width;

                dropDown.prop("disabled", true);

                detailImage.empty();
                previewImage.attr("src", 'png/'+ imageFilename);

                const curCsvFilename = frameName + '.txt';

                const minSide = Math.min(imgWidth, imgHeight);
                const lensSize = minSide*ZOOM_LEVEL;
                draggableLens.width(lensSize).height(lensSize);

                $.ajax({
                    url: "txt/" + curCsvFilename,
                    success: function (csvd) {
                        initDataFromCsv(csvd)
                    },
                    error: function() {
                        initDataFromCsv("")
                    },
                    complete: function(){
                        dropDown.prop("disabled", false);
                    },
                    dataType: "text",
                });

                function initDataFromCsv(csvText){
                    const allData = $.csv.toArrays(csvText);

                    for (const data of allData) {
                        addObject(data);
                    }
                    refreshViewport();
                    refreshTextView();
                }

                cx = detailImage.outerWidth() / draggableLens.outerWidth();
                cy = detailImage.outerHeight() / draggableLens.outerHeight();

                detailImage.css('background-image', "url('" + previewImage.attr('src') + "')")
                    .css('background-size', (imgWidth * cx) + "px " + (imgHeight * cy) + "px");

                imageScaleRatio = [(imgWidth * cx)/rawImageSize[0], (imgHeight * cy)/rawImageSize[1]];
            }
        });
    }

    function newObjectTemplateDragEnd(event, ui)    {
        // Create a new object based on the template type and position
        const newObjectTemplate = ui.helper;
        const svgElement = newObjectTemplate.children()[0];

        const offsetLeft = parseInt(svgElement.style.left);
        const offsetTop = parseInt(svgElement.style.top);

        const globalpos_x = ((newObjectTemplate.offset().left + svgElement.width.baseVal.value/2 + offsetLeft
            - parseInt(detailImage.css('backgroundPositionX')) - detailImage.offset().left)/imageScaleRatio[0])|0;
        const globalpos_y =  ((newObjectTemplate.offset().top + svgElement.height.baseVal.value/2 + offsetTop
            - parseInt(detailImage.css('backgroundPositionY')) - detailImage.offset().top)/imageScaleRatio[1])|0;

        addObject([globalpos_x, globalpos_y, newObjectTemplate.data('type'), 0]);

        // bring back draggable to init position
        newObjectTemplate.css("left", "");
        newObjectTemplate.css("top", "");

        saveAll();
        refreshViewport();
        refreshTextView();
    }

    function addObject(objectInfos) {

        let newObject =  newObjectTemplates[objectInfos[2]].clone();
        newObject.css("position", "absolute");
        newObject.attr("data-type", objectInfos[2]);
        newObject.attr("data-globalpos_x", objectInfos[0]);
        newObject.attr("data-globalpos_y", objectInfos[1]);
        newObject.attr("data-angle", objectInfos[3]);

        newObject.dblclick(function() {
            $(this).remove();
            saveAll();
            refreshTextView();
        });

        const objectType = parseInt(objectInfos[2]);
        const canRotate = objectCanRotate[objectType];

        if(canRotate) {
            const childSvg = newObject.children();
            $(childSvg).rotate(parseInt(objectInfos[3]));
            childSvg.find("#rotate-handle").draggable({
                drag: objectRotate,
                stop: function () {
                    saveAll();
                    refreshTextView();
                }
            });
            newObject.draggable({
                containment: "#detail-image",
                stop: objectDragEnd,
                cancel: "#rotate-handle",
            });
        } else {
            newObject.draggable({
                containment: "#detail-image",
                stop: objectDragEnd,
            });
        }
        detailImage.append(newObject[0]);
    }

    function objectRotate(e, ui) {

        function getAngle(event, rotateCenterX, rotateCenterY)
        {
            const offX = -event.pageX + rotateCenterX;
            const offY =  -event.pageY + rotateCenterY;
            return Math.atan2(offY, offX)* (180/Math.PI);
        }

        const svgElement = ui.helper.parent();
        const objectRootElement = svgElement.parent();
        const rotateCenterX = objectRootElement.offset().left + parseInt(objectRootElement.width())/2;
        const rotateCenterY = objectRootElement.offset().top + parseInt(objectRootElement.width())/2;
        let newAngle = getAngle(e, rotateCenterX, rotateCenterY) + 90;
        newAngle = ((newAngle % 360 + 360) % 360)|0;
        svgElement.rotate(newAngle);
        objectRootElement.attr("data-angle", newAngle);
    }

    function objectDragEnd(e, ui) {
        const objectRootElement = ui.helper;
        const svgElement = objectRootElement.children()[0];
        const offsetLeft = parseInt(svgElement.style.left);
        const offsetTop = parseInt(svgElement.style.top);

        objectRootElement[0].dataset.globalpos_x = (($(this).position().left + svgElement.width.baseVal.value/2 + offsetLeft
           - parseInt(detailImage.css('backgroundPositionX')))/imageScaleRatio[0])|0;
        objectRootElement[0].dataset.globalpos_y =  (($(this).position().top + svgElement.height.baseVal.value/2 + offsetTop
           - parseInt(detailImage.css('backgroundPositionY')))/imageScaleRatio[1]|0);

        saveAll();
        refreshTextView();
    }

    function refreshViewport() {
        const lens_position = draggableLens.position();

        const backgroundPositionX = -lens_position.left * cx;
        const backgroundPositionY = -lens_position.top * cy;
        detailImage.css('backgroundPosition', backgroundPositionX + "px " + backgroundPositionY + "px");

        for (const objectRootElement of detailImage.children()) {

            const svgElement = $(objectRootElement).children()[0];
            const svgWidth = svgElement.width.baseVal.value;
            const svgHeight = svgElement.height.baseVal.value;
            const offsetLeft = parseInt(svgElement.style.left);
            const offsetTop = parseInt(svgElement.style.top);

            const posLeft = objectRootElement.dataset.globalpos_x*imageScaleRatio[0]
                + backgroundPositionX - svgWidth/2 - offsetLeft;
            const posTop = objectRootElement.dataset.globalpos_y*imageScaleRatio[1]
                + backgroundPositionY - svgHeight/2 - offsetTop;

            objectRootElement.style.left = posLeft + "px";
            objectRootElement.style.top = posTop + "px";
            //Only display objects visible in the viewport for performance
            if(posLeft + svgWidth < 0 || posTop + svgHeight < 0
                || posLeft > detailImage.outerWidth() || posTop > detailImage.outerHeight()){
                objectRootElement.style.display = "none";
            } else {
                objectRootElement.style.display = "";
            }
        }
    }

    function refreshTextView() {

        function resToText(allResults) {
            let lines = [["x","y", "type", "angle"].join("\t")];
            for (const res of allResults) {
                lines.push([res.x, res.y, res.type, res.a].join("\t"))
            }
            return lines.join("\n");
        }
        let infosToDisplay = [];

        for (const objectRootElement of detailImage.children()) {
            infosToDisplay.push({x: objectRootElement.dataset.globalpos_x,
                y: objectRootElement.dataset.globalpos_y, type:objectRootElement.dataset.type, a:objectRootElement.dataset.angle });
        }
        infosText.val(resToText(infosToDisplay));
    }

});
