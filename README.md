Annotation tool for dense objects detection
===========================================
Annotation tool developed to mark bees in an image, for a project described here: [Towards Dense Object Tracking in a 2D Honeybee Hive](http://openaccess.thecvf.com/content_cvpr_2018/html/Bozek_Towards_Dense_Object_CVPR_2018_paper.html). 
There are two classes of objects: fully visible bees where the main axis can be set, and bee abdomens when a bee is going into a cell.

The tool is based on Node.js and is supposed to be used locally as a desktop application.

![](doc/video_tuto.gif)

## Requirements
Install [Node.js](https://nodejs.org/en/download/)

## Get started
Run this command once from this folder to install dependencies:   
``npm install``

Start the server using the command:  
``node server.js``

Access the webpage on a recent web browser at the address:   
http://localhost:3000/

A sample image and annotations from the [bee dataset](https://groups.oist.jp/bptu/honeybee-tracking-dataset) will be displayed.


      
## How to use

Choose an image to annotate using the dropdown menu on the top left.

Add new symbols by dragging and dropping the new symbols on the top right into the image.
Move existing bee annotations by drag and drop. 
Rotate the fully visible bees by dragging the circular rotation handle on the symbol.  
Double click on any symbol to delete it.

The results are saved automatically at each modification and will overwrite the files in static/txt.

Click "Export preview" to create a preview image in static/preview.


## Modify for a different dataset
This tool is suited to mark relatively fixed sized objects in an image, with possibly a main axis.

To replace the sample image with other images, copy images and annotation resources in the folder "static" in the following structure and relaunch the webpage. Only .png images are supported without a small code modification. The file names should match between the png and the txt folders.
 ```
static
+-- png  
|   +-- *.png  
+-- txt 
|   +-- *.txt   (optional, will be created if doesn't exist)  
```

The zoom feature allows to annotate large resolution images : the parameter ZOOM_LEVEL should be set depending on the image resolution and the desired size of the new custom symbols.  

To replace the bee classes with custom symbols, modify the file static/object-templates.html. This file contains the layout of the object templates that are dragged into the image.  
The new object-templates.html should respect the structure of the original file :  
- one layout div that specifies the layout of the draggable template objects.
- several children of the layout node for each class, with the attribute "data-type".
- one child node for each class div of type svg, which will be the drawing of the symbol. The attributes left and top should be specified and the position should be relative.
- inside the svg node, possibly a node with id "rotate-handle" if the element should be able to rotate. In that case set the attribute transform-origin: 50% 50% to the svg node to set the axis of rotation in the center of the element.
- control which zone of the symbol is draggable or not with the pointer-events attribute.

The optional generate preview feature should also be modified with custom symbols drawing.

## Contact

If you have any questions about this tool, please contact:  
laetitia.hebert at oist.jp  
kasia.bozek at oist.jp  
