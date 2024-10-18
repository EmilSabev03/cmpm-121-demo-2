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

    constructor( x: number, y: number )
    {
        this.points = [{ x, y }]
    }

    drag(x: number, y: number)
    {
        this.points.push({x, y});
    }

    display(context: CanvasRenderingContext2D)
    {
        context.strokeStyle = "black";
        context.lineWidth = 4;
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

//add title to webpage
const title = "Test";
document.title = title;
const header = document.createElement("h1");
header.innerHTML = title;
app.append(header);

//add canvas to webpage
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

//add array of points. redoPoints, and cursorCommand
let commands: LineCommand[] = [];
let redoCommands: LineCommand[] = [];
let cursorCommand: CursorCommand | null = null;

//add context and cursor to draw
const context = canvas.getContext("2d");
const cursor = { active: false, x: 0, y: 0 };


//add event bus and notify function
const bus = new EventTarget();

function notify(name: string) 
{
    bus.dispatchEvent(new Event(name));
}

//redraw function that utilizes commands
function redraw()
{
    clearCanvas();
    commands.forEach((command) => command.display(context!));

    if (cursorCommand)
    {
        cursorCommand.display(context!);
    }
}

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("cursor-changed", redraw);


//add event listener and button for clear
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => 
{
    if (context != null) { clearCanvas(); }
    commands.length = 0;
    redoCommands.length = 0;
    notify("drawing-changed");
});

//add event listener and button for undo
const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => 
{
    if (commands.length > 0)
    {
        const undoLine = commands.pop()!;
        redoCommands.push(undoLine);
        notify("drawing-changed");
    }
});

//add event listener and button for redo
const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => 
{
    if (redoCommands.length > 0)
    {
        const redoLine = redoCommands.pop()!;
        commands.push(redoLine);
        notify("drawing-changed");
    }
});

let currentLineCommand: LineCommand | null = null;

//add event listeners for mouse movement
canvas.addEventListener("mousedown", (event) => 
{
    currentLineCommand = new LineCommand(event.offsetX, event.offsetY);
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

    if (event.buttons === 1 && currentLineCommand)
    {
        currentLineCommand.drag(event.offsetX, event.offsetY);
        notify("drawing-changed");
    }
});

canvas.addEventListener("mouseup", () => { cursor.active = false; });
canvas.addEventListener("drawing-changed", (event) => { drawingChangedObserver(); })

//function to simplify cleaning the canvas
function clearCanvas()
{
    context?.clearRect(0, 0, canvas.width, canvas.height);
}

//observer for drawing-changed event
function drawingChangedObserver()
{
    if (context != null)
    {
        clearCanvas();
        context.beginPath();

        for (const line of commands)
        {
            line.display(context);
        }
        
        if (cursor.active)
        {
            const cursorCommand = new CursorCommand(cursor.x, cursor.y);
            cursorCommand.display(context);
        }
    }
}
