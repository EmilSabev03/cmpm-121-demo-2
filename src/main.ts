import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

//define interface for displaying context
interface Displayable
{
    display(context: CanvasRenderingContext2D): void;
}

//define class for line commands
class LineCommand implements Displayable
{
    points: { x: number; y: number }[];
    lineThickness: number;

    constructor( x: number, y: number, lineThickness: number )
    {
        this.points = [{ x, y }]
        this.lineThickness = lineThickness;
    }

    drag(x: number, y: number)
    {
        this.points.push({x, y});
    }

    display(context: CanvasRenderingContext2D)
    {
        context.strokeStyle = "black";
        context.lineWidth = this.lineThickness;
        context.beginPath();
        const {x, y} = this.points[0];
        context.moveTo(x,y);
        for (const {x, y} of this.points)
        {
            context.lineTo(x, y);
        }
        context.stroke();
    }

}

//define class for tool preview commands
class ToolPreviewCommand implements Displayable
{
    x: number;
    y: number;
    lineThickness: number;

    constructor(x: number, y: number, lineThickness: number)
    {
        this.x = x;
        this.y = y;
        this.lineThickness = lineThickness;
    }

    display(context: CanvasRenderingContext2D)
    {
        context.beginPath();
        context.arc(this.x, this.y, this.lineThickness / 2, 0, Math.PI * 2);
        context.fillStyle = 'black';
        context.fill();
        context.closePath();
    }
}

//define class for sticker commands
class StickerCommand implements Displayable
{
    x: number;
    y: number;
    sticker: string;

    constructor(x: number, y: number, sticker: string)
    {
        this.x = x - 32;
        this.y = y - 3;
        this.sticker = sticker;
    }

    display(context: CanvasRenderingContext2D)
    {
        context.font = "32px monospace";
        context.fillText(this.sticker, this.x, this.y);
    }

    drag(x: number, y: number)
    {
        this.x = x - 32;
        this.y = y - 3;
    }
}

//define class for sticker emoji preview
class StickerPreviewCommand implements Displayable
{
    x: number;
    y: number;
    sticker: string;

    constructor(x: number, y: number, sticker: string)
    {
        this.x = x - 32;
        this.y = y - 3;
        this.sticker = sticker;
    }

    display(context: CanvasRenderingContext2D)
    {
        context.font = "32px monospace";
        context.fillText(this.sticker, this.x, this.y);
    }
}



// For a vertical layout with buttons below the canvas
document.body.style.flexDirection = "column";

//add title to webpage
const title = "Sticker Sketchpad";
document.title = title;
const header = document.createElement("h1");
header.innerHTML = title;
app.append(header);

//add canvas to webpage
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

//add array of commands, redoCommands, and stickers
const commands: (LineCommand | StickerCommand)[] = [];
const redoCommands: (LineCommand | StickerCommand)[] = [];
const stickers = ['🤠', '😎', '🎃'];

//define global variables to handle commands
let currentLineThickness: number = 4.5;
let toolPreviewCommand: ToolPreviewCommand | null = null;
let currentLineCommand: LineCommand | null = null;
let stickerPreviewCommand: StickerPreviewCommand | null = null;
let stickerCommand: StickerCommand | null = null;
let currentSticker: string | null = null;

//add context and cursor to draw
const context = canvas.getContext("2d");
const cursor = { active: false, x: 0, y: 0 };


//add event bus and notify function
const bus = new EventTarget();

function notify(name: string) 
{
    bus.dispatchEvent(new Event(name));
}

//redraws the canvas based on commands
function redraw()
{
    clearCanvas();
    commands.forEach((command) => command.display(context!));
    
    if (toolPreviewCommand && !cursor.active)
    {
        toolPreviewCommand?.display(context!);
    }

    if (stickerPreviewCommand && currentSticker)
    {
        stickerPreviewCommand.display(context!);
    }

    
}

//add drawing changed, cursor changed, tool moved events to bus
bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("cursor-changed", redraw);
bus.addEventListener("tool-moved", redraw);


//add all buttons and their respective event listeners to the webpage
createButton("clear", () =>
{ 
    if (context != null) { clearCanvas(); } 
    commands.length = 0; 
    redoCommands.length = 0; 
    notify("drawing-changed"); 
});

createButton("undo", () => 
{ 
    if (commands.length > 0) 
    { 
        const undoLine = commands.pop(); 
        redoCommands.push(undoLine!); 
        notify("drawing-changed"); 
    } 
});

createButton("redo", () => 
{
    if (redoCommands.length > 0) 
    { 
        const redoLine = redoCommands.pop(); 
        commands.push(redoLine!); 
        notify("drawing-changed");
    }
});

createButton("thin marker", () => 
{ 
    currentLineThickness = 2; 
    currentSticker = null;
    stickerCommand = null;
});

createButton("thick marker", () => 
{ 
    currentLineThickness = 4.5; 
    currentSticker = null;
    stickerCommand = null;
});

//exports a 1024x1024 png file of the drawing
createButton("export", () =>
{
    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = 1024;
    scaledCanvas.height = 1024;
    app.appendChild(scaledCanvas);

    const exportContext = scaledCanvas.getContext("2d");

    if (exportContext!)
    {
        exportContext.scale(4, 4);
        commands.forEach(command => 
        {
            command.display(exportContext);
        });
    }
    
    const anchor = document.createElement("a");
    anchor.href = scaledCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();

    if (scaledCanvas.parentElement !== null)
    {
        scaledCanvas.parentElement.removeChild(scaledCanvas);
    }
    
});

//custom sticker button that handles user input
createButton("create custom sticker", () =>
{
    let userInput: boolean = true;
    while (userInput)
    {
        const text = prompt("Enter custom stickers (-1 to exit)");
        if (text === "-1")
        {
            userInput = false;
        }

        else if (text !== null && text.trim() !== "")
        {
            stickers.push(text);
            createButton(text, () => 
            {
                currentSticker = text;
                stickerPreviewCommand = new StickerPreviewCommand(cursor.x, cursor.y, currentSticker);
                notify("tool-moved");
            });
        }
    }
});

//adds the initial stickers
stickers.forEach((sticker) => 
{
    createButton(sticker, () => 
    {
        currentSticker = sticker;
        stickerPreviewCommand = new StickerPreviewCommand(cursor.x, cursor.y, currentSticker);
        notify("tool-moved");
    });
});

//function that helps simplify button and event listeners
function createButton(buttonText: string, onClick: () => void) 
{
    const button = document.createElement("button");
    button.innerHTML = buttonText;
    button.addEventListener("click", onClick);
    document.body.append(button);
    return button;
}



//event listeners for mouse input
canvas.addEventListener("mousedown", (event) => 
{
    if (currentSticker)
    {
        stickerCommand = new StickerCommand(event.offsetX, event.offsetY, currentSticker);
        commands.push(stickerCommand);
        redoCommands.length = 0;
    }

    else
    {
        currentLineCommand = new LineCommand(event.offsetX, event.offsetY, currentLineThickness);
        commands.push(currentLineCommand);
        redoCommands.length = 0;
    }

    notify("drawing-changed");

});

canvas.addEventListener("mousemove", (event) => 
{
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
    cursor.active = true;

    notify("cursor-changed");

    if (event.buttons === 0)
    {
        cursor.active = false;

        if (currentSticker)
        {
            stickerPreviewCommand = new StickerPreviewCommand(event.offsetX, event.offsetY, currentSticker);
        }

        else
        {
            toolPreviewCommand = new ToolPreviewCommand(cursor.x, cursor.y, currentLineThickness);
        }
    
        notify("tool-moved");
    }

    if (event.buttons === 1 && currentLineCommand != null)
    {
        currentLineCommand.drag(event.offsetX, event.offsetY);
        notify("drawing-changed");
    }

    if (event.buttons === 1 && stickerCommand != null)
    {
        stickerCommand.drag(event.offsetX, event.offsetY);
        notify("drawing-changed");
    }
});

canvas.addEventListener("mouseup", () => 
{ 
    cursor.active = false; 
    currentLineCommand = null;
    toolPreviewCommand = null;
});

//function to simplify clearing the canvas
function clearCanvas()
{
    context?.clearRect(0, 0, canvas.width, canvas.height);
}