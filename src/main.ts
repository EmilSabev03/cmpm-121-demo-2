import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

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

//add array of points, undoPoints, and redoPoints
let points: {x: number, y: number}[][] = [];
let undoPoints: {x: number, y: number}[][] = [];
let redoPoints: {x: number, y: number}[][] = [];

//add context and cursor to draw
const context = canvas.getContext("2d");
const cursor = { active: false, x: 0, y: 0 };

//add event listener and button for clear
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => 
{
    if (context != null) { context.clearRect(0, 0, canvas.width, canvas.height); }
    points.length = 0;
    undoPoints.length = 0;  
    redoPoints.length = 0;
});

//add event listener and button for undo
const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => 
{
    if (points.length > 0)
    {
        const undoLine = points.pop()!;
        redoPoints.push(undoLine);
        drawingChangedObserver();
    }
});

//add event listener and button for redo
const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => 
{
    if (redoPoints.length > 0)
    {
        const redoLine = redoPoints.pop()!;
        points.push(redoLine);
        drawingChangedObserver();
    }
});

//add event listeners for mouse movement
canvas.addEventListener("mousedown", (event) => 
{
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
    points.push([{ x: cursor.x, y: cursor.y}]);
});

canvas.addEventListener("mousemove", (event) => 
{
    if (cursor.active && context != null) 
    {
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;

        const currentLine = points[points.length - 1];
        currentLine.push({ x: cursor.x, y: cursor.y });

        //drawing changed event and dispatch event to observer
        const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { x: cursor.x, y: cursor.y }});
        canvas.dispatchEvent(drawingChangedEvent);
    }
});


canvas.addEventListener("mouseup", () => 
{
    cursor.active = false;
});


canvas.addEventListener("drawing-changed", (event) => 
{
    drawingChangedObserver(); 
})


//observer for drawing-changed event
function drawingChangedObserver()
{
    if (context != null)
    {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();

        for (let i = 0; i < points.length; i++)
        {
            let line = points[i];
            for (let j = 0; j < line.length; j++)
            {
                const point = line[j];
                if (j === 0)
                {
                    context.moveTo(point.x, point.y)    
                }
                else
                {
                    context.lineTo(point.x, point.y)
                }
            }
        }     
        context.stroke();
    }
}
