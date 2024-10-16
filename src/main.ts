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

//add context and cursor to draw
const context = canvas.getContext("2d");
const cursor = { active: false, x: 0, y: 0 };

//add clear button and event listener for clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => 
{
    if (context != null) { context.clearRect(0, 0, canvas.width, canvas.height); }
});

//add event listeners for mouse movement
canvas.addEventListener("mousedown", (event) => 
{
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
});

canvas.addEventListener("mousemove", (event) => 
{
    if (cursor.active && context != null) 
    {
        context.beginPath();
        context.moveTo(cursor.x, cursor.y);
        context.lineTo(event.offsetX, event.offsetY);
        context.stroke();
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
    }
});

canvas.addEventListener("mouseup", () => 
{
    cursor.active = false;
});


