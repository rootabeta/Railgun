// Get version of Railgun, for crafting requests
let VERSION = chrome.runtime.getManifest().version;

let USER = localStorage.getItem("rguser");
let rotitle = localStorage.getItem("rgrotitle") || "Railgun";
let suctitle = localStorage.getItem("rgsuctitle") || "Task Failed Successorly";
let govtitle = localStorage.getItem("rggovtitle") || "Maintain A";
let JUMP_POINT = localStorage.getItem("rgjumppoint") || "suspicious";
let USER_AGENT = `Railgun/${VERSION} (By: Volstrostia; usedBy: ${USER})`;

console.debug(USER_AGENT);

function loadSettings(settings) { 
	//Whenever this function fires, we know that we have new data from settings
	//This means we can discard whatever we had, and update to the new stuff
	//This way, we can change things and have it reflected on the next refresh
	if (settings.user) { 
		USER = settings.user;
		localStorage.setItem("rguser", settings.user);
	}

	if (settings.ro) { 
		rotitle = settings.ro;
		localStorage.setItem("rgrotitle",settings.ro);
	}

	if (settings.gov) { 
		govtitle = settings.gov;
		localStorage.setItem("rggovtitle",settings.gov);
	}

	if (settings.suc) { 
		suctitle = settings.suc;
		localStorage.setItem("rgsuctitle",settings.suc);
	}

	if (settings.jp) { 
		JUMP_POINT = settings.jp;
		localStorage.setItem("rgjumppoint",settings.jp);
	}
}

function settingsFailed(error) { 
	console.error("Railgun: Failed to load settings");
	console.error(error);

	// Assume failed condition
	// If we already have a good value, use that. Otherwise, use defaults.
	if (!localStorage.getItem("rguser")) { 
		failStatus("Railgun failed to load user from settings and cannot acquire cached value");
		lockSimul();
	} else { 
		let USER = localStorage.getItem("rguser");
	}

	let rotitle = localStorage.getItem("rgrotitle") || "Railgun";
	let suctitle = localStorage.getItem("rgsuctitle") || "Task Failed Successorly";
	let govtitle = localStorage.getItem("rggovtitle") || "Maintain A";
	let JUMP_POINT = localStorage.getItem("rgjumppoint") || "Suspicious";
}

const getting = chrome.storage.sync.get();
getting.then(loadSettings, settingsFailed);

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

if (USER != "") { 
	updStatus(`Railgun ${VERSION} loaded (user: ${USER}), awaiting command`);
} else { 
	failStatus("User could not be pulled from settings - setup is required");
	// chrome.runtime.openOptionsPage();
}
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
// TODO: Make these values persistant and refreshed every pageload - including XMLHttpRequests!
var localid = some("localid") || localStorage.getItem("rglocalid");
var chk = some("chk") || localStorage.getItem("rgchk");
var region = some("region_name") || localStorage.getItem("rgregion");
var nation = document.getElementsByClassName("bellink")[0].href.split("=")[1] || localStorage.getItem("rgnation");

// Write back values into local cache
localStorage.setItem("rglocalid", localid);
localStorage.setItem("rgchk", chk); // Useful for stuff like resignation
localStorage.setItem("rgnation", nation); // Current nation
localStorage.setItem("rgregion", region); // *Current* region

console.debug(`LocalID: ${localid} | chk: ${chk}`);

// Where the magic happens
document.addEventListener('keyup', function(event) { 
	if (USER == "") { 
		failStatus("Cannot perform activity without user ID. Edit settings and refresh.");
		return;
	}
	if (event.shiftKey || event.ctrlKey || event.altKey || document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA') { // locks you out of the script while you're holding down a modifier key or typing in an input
		return;
	} else {
		// Extra safeguard - if simultaneity in effect, drop any keybinds
		if (window.simulLocked) { 
			warnStatus("Cannot process, simultaneity in effect!");
			return;
		}
		let USERCLICK = Date.now();
		const xhr = new XMLHttpRequest(); // Used to fire off web request
		switch (event.code) { // event.code is the key that was pressed
			// Resign WA
			case 'KeyE': 
				lockSimul();

				if (document.location.href.includes("page=join_WA")) { 
					updStatus("Joining the World Assembly");

					let APPID = document.getElementsByName("appid")[0].value;
					let nation = document.getElementsByClassName("nlink")[0].href.split("=")[1];

					localStorage.setItem("rgnation", nation); // Current nation
					localStorage.setItem("rgchk", ""); // Clear out auth values
					localStorage.setItem("rglocalid", "");
					// Copy to clipboard
					navigator.clipboard.writeText(`https://www.nationstates.net/nation=${nation}`); 


					// TODO: Surely it's easier to just click the button
					// Then again, that requires debugging onclick
					xhr.open("POST", `/cgi-bin/join_un.cgi/template-overall=none/userclick=${USERCLICK}`);
					xhr.setRequestHeader("User-Agent", USER_AGENT);
					// Deliver URL-Encoded form data, like NS site normally does
					xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					xhr.onload = () => { 
						if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) { 
							successStatus("Joined WA successfully");
							// Finished request, unlock simultaneity
							unlockSimul();
						}
					};

					// Send request to join WA
					xhr.send(`nation=${nation}&appid=${APPID}`);

				} else { 

					updStatus("Resigning from the World Assembly");
					if (!chk) { 
						failStatus("Could not fetch chk value");
						// document.location.href = "https://www.nationstates.net/page=un/template-overall=none";
					}

					// Set userclick and useragent
					xhr.open("POST", `/page=UN_status/template-overall=none/userclick=${USERCLICK}`);
					xhr.setRequestHeader("User-Agent", USER_AGENT);
					// Deliver URL-Encoded form data, like NS site normally does
					xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					xhr.onload = () => { 
						if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) { 
							successStatus("Resigned from WA successfully");
							// Finished request, unlock simultaneity
							unlockSimul();
						}
					};

					// Send request to leave WA
					xhr.send(`action=leave_UN&chk=${chk}&submit=1`);
				}

				break;

			// Go to sus
			case 'KeyB':
				updStatus(`Redirecting to ${JUMP_POINT}`);
				lockSimul();
				document.location.href = `https://www.nationstates.net/region=${JUMP_POINT}`;
				break;

			// Refresh
			case 'KeyA': 
				updStatus("Triggering refresh of page");
				lockSimul();
				window.location.reload();
				// No need to unlock, page will be reloaded
				break;

			// RO yourself
			case 'KeyD':
				if (!region) { 
					failStatus("Cannot detect current region");
					break;
				}
				lockSimul();
				updStatus(`ROing in ${region}`);
				// Set userclick and useragent
				xhr.open("POST", `/region=${region}/template-overall=none/userclick=${USERCLICK}`);
				xhr.setRequestHeader("User-Agent", USER_AGENT);
				// Deliver URL-Encoded form data, like NS site normally does
				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhr.onload = () => { 
					if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) { 
						successStatus(`RO'd in ${region} successfully`);
						// Finished request, unlock simultaneity
						unlockSimul();
					}
				};

				let RO_name = rotitle;
				// Tagging RO options
				xhr.send(`page=region_control&region=${region}&chk=${chk}&nation=${nation}&office_name=${RO_name}&authority_A=on&authority_C=on&authority_E=on&authority_P=on&editofficer=1`);

			// Move to region
			case 'KeyF':
				if (document.location.href.includes("region=")) { 
					if (!region) {
						warnStatus("Cannot move to region you are already in");
						break;
					}

					updStatus(`Moving to region ${region}`);
					lockSimul();

					// Set userclick and useragent
					xhr.open("POST", `/page=change_region/template-overall=none/userclick=${USERCLICK}`);
					xhr.setRequestHeader("User-Agent", USER_AGENT);
					// Deliver URL-Encoded form data, like NS site normally does
					xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					xhr.onload = () => { 
						if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) { 
							// TODO: Scrape values like chk, localid, WA membership status, etc. where relevant
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
