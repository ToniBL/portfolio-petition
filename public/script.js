let isDrawing = false;
let x = 0;
let Y = 0;
const myCanvas = document.getElementById("signature");
const context = myCanvas.getContext("2d");
const form = document.getElementById("form");
const inputfield = document.getElementById("inputfield");

context.strokesStyle = "black";
context.lineWidth = 2;
form.addEventListener("submit", (e) => {
    e.preventDefault();
    inputfield.value = myCanvas.toDataURL();
    console.log(inputfield.value);
    form.submit();
});
myCanvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
});

myCanvas.addEventListener("mousemove", drawLine);

myCanvas.addEventListener("mouseup", () => (isDrawing = false));

myCanvas.addEventListener("mouseout", () => (isDrawing = false));

function drawLine(event) {
    if (!isDrawing) return;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(event.offsetX, event.offsetY);
    context.stroke();
    x = event.offsetX;
    y = event.offsetY;
}
