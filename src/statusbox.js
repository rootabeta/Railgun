// Create status popup
let statusBox = document.createElement("div");
statusBox.id = "railgunStatus";
statusBox.style="position:fixed;z-index:1;bottom:0;left:0;padding-bottom:10%;width:50;height:50";
statusBox.style.backgroundColor = "grey";

// Center contents of status popup
let makeCenter = document.createElement("center");
let statusText = document.createElement("pre"); 

function updStatus(message) { 
	statusBox.style.backgroundColor = "grey";
	console.log(message);
	statusText.textContent = message;
}

function warnStatus(message) { 
	statusBox.style.backgroundColor = "yellow";
	console.warn(message);
	statusText.textContent = message;
}

function failStatus(message) { 
	statusBox.style.backgroundColor = "red";
	console.error(message);
	statusText.textContent = message;
}

function successStatus(message) { 
	statusBox.style.backgroundColor = "green";
	console.log(message);
	statusText.textContent = message;
}

makeCenter.appendChild(statusText);
statusBox.appendChild(makeCenter);

document.body.appendChild(statusBox);
