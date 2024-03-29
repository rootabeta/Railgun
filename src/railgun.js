// Get version of Railgun, for crafting requests
let VERSION = chrome.runtime.getManifest().version;
let USER = "Volstrostia"; //TODO: Require user to set user-agent before use! See YAFFeather settings!
let USER_AGENT = `Railgun/${VERSION} (By: Volstrostia; usedBy:${USER})`;
console.debug(USER_AGENT);

// Create status popup
let statusBox = document.createElement("div");
statusBox.id = "railgunStatus";
statusBox.style="position:fixed;z-index:1;bottom:0;left:0;padding-bottom:10%;width:50;height:50";
statusBox.style.backgroundColor = "grey";

// Center contents of status popup
let makeCenter = document.createElement("center");
let statusText = document.createElement("h3"); 

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

updStatus(`Railgun ${VERSION} loaded, awaiting command`);

makeCenter.appendChild(statusText);
statusBox.appendChild(makeCenter);

document.body.appendChild(statusBox);

// Functions to lock or unlock elements for simultaneity
function lockSimul() { 
	window.simulLocked = true;
	let elements = document.querySelectorAll('button[type=submit]');
	for (i=0;i<elements.length;i++) { 
		let element = elements[i];
		// Set simultaneity flag
		element.setAttribute("disabledforsimultaneity", true);
		// Disable element
		element.setAttribute("disabled", true);
	}
}

function unlockSimul() { 
	window.simulLocked = false;
	let elements = document.querySelectorAll('[disabledforsimultaneity]');
	for (i=0;i<elements.length;i++) { 
		let element = elements[i];
		// Remove simultaneity flag
		element.removeAttribute("disabledforsimultaneity");
		// Re-enable element
		element.removeAttribute("disabled");
	}
}

// Force submit buttons to enforce simultaneity once clicked
// This submits the parent form, but only if the button is clicked
// If the button is disabled, onclick never triggers and the submission never occurs
let allButtons = document.querySelectorAll('button[type=submit]');
for (i=0;i<allButtons.length;i++) { 
	allButtons[i].setAttribute("onclick", "$('form input[type=\"submit\"], form button').attr(\"disabled\", true).addClass(\"disabledForSimultaneity\");");
}

function some(name) { 
	if (document.getElementsByName(name).length > 0) { 
		return document.getElementsByName(name)[0].value;
	} else { 
		return null;
	}
}

// Build overhead for sending requests when we need to

let localid = some("localid");
let chk = some("chk");

console.debug(`LocalID: ${localid} | chk: ${chk}`);

// Where the magic happens
document.addEventListener('keyup', function(event) { 
	if (event.shiftKey || event.ctrlKey || event.altKey || document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA') { // locks you out of the script while you're holding down a modifier key or typing in an input
		return;
	} else {
		// Extra safeguard - if simultaneity in effect, drop any keybinds
		if (window.simulLocked) { 
			warnStatus("Cannot process, simultaneity in effect!");
			return;
		}
		let USERCLICK = Date.now();
		switch (event.code) { // event.code is the key that was pressed
			case 'KeyA': 
				updStatus("Triggering refresh of page");
				lockSimul();
				window.location.reload();
				// No need to unlock, page will be reloaded
				break;

			case 'KeyF':
				if (document.location.href.includes("region=")) { 
					let region = some("region_name"); 
					if (!region) { 
						warnStatus("Cannot move to region you are already in");
						break;
					}

					updStatus(`Moving to region ${region}`);
					lockSimul();

					const xhr = new XMLHttpRequest(); 
					// Set userclick and useragent
					xhr.open("POST", `/page=change_region/userclick=${USERCLICK}`);
					xhr.setRequestHeader("User-Agent", USER_AGENT);
					// Deliver URL-Encoded form data, like NS site normally does
					xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					xhr.onload = () => { 
						if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) { 
							successStatus(`Moved to ${region} successfully`);
							// Finished request, unlock simultaneity
							unlockSimul();
						}
					};

					xhr.send(`localid=${localid}&region_name=${region}&move_region=1`);
					break;

				} else { 
					warnStatus("Not looking at region");
				}
				break;
		}
	}
});
