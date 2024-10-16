import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

//define interface for displaying context
interface Displayable
{
    display(context: CanvasRenderingContext2D): void;
}

//define class that handles line commands
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

//define class that handles cursor commands
class CursorCommand implements Displayable
{
    x: number;
    y: number;

    constructor (x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }

    display(context: CanvasRenderingContext2D)
    {
        context.font = "32px monospace";
        context.fillText("*", this.x - 8, this.y + 16);
    }
}

//define class that handles tool preview command
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

//add array of commands and redoCommands
let commands: LineCommand[] = [];
let redoCommands: LineCommand[] = [];

//define global variables to handle commands
let cursorCommand: CursorCommand | null = null;
let currentLineThickness: number = 4;
let toolPreviewCommand: ToolPreviewCommand | null = null;
let currentLineCommand: LineCommand | null = null;

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

    if (cursorCommand)
    {
        cursorCommand.display(context!);
    }
    
    if (toolPreviewCommand && !cursor.active)
    {
        toolPreviewCommand?.display(context!);
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

const thinButton = createButton("thin marker", () => { currentLineThickness = 1; });
const thickButton = createButton("thick marker", () => { currentLineThickness = 4; });


//function that helps simplify button and event listeners
function createButton(buttonText, onClick) 
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
    currentLineCommand = new LineCommand(event.offsetX, event.offsetY, currentLineThickness);
    commands.push(currentLineCommand);
    redoCommands.length = 0;
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
        toolPreviewCommand = new ToolPreviewCommand(cursor.x, cursor.y, currentLineThickness);
        notify("tool-moved");
    }

    if (event.buttons === 1 && currentLineCommand != null)
    {
        currentLineCommand.drag(event.offsetX, event.offsetY);
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