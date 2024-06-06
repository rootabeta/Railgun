// Get version of Railgun, for crafting requests
let VERSION = chrome.runtime.getManifest().version;

let USER = localStorage.getItem("rguser");
let rotitle = localStorage.getItem("rgrotitle") || "Railgun";
let suctitle = localStorage.getItem("rgsuctitle") || "Task Failed Successorly";
let govtitle = localStorage.getItem("rggovtitle") || "Maintain A";
let JUMP_POINT = localStorage.getItem("rgjumppoint") || "suspicious";
let MAGAZINE = JSON.parse(localStorage.getItem("rgmagazine")) || []

// Identification strings
let USER_AGENT = `Railgun/${VERSION} (By: Volstrostia; usedBy: ${USER})`;
let USER_URL = `Railgun_${VERSION}_by_Volstrostia_usedBy_${USER}`; // For chrome

// Functions to lock or unlock elements for simultaneity
function lockSimul() { 
        console.debug(`You are ${USER}`);
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

function loadSettings(settings) { 
	//Whenever this function fires, we know that we have new data from settings
	//This means we can discard whatever we had, and update to the new stuff
	//This way, we can change things and have it reflected on the next refresh
	if (settings.user) { 
		if (settings.user != "null") { 
			USER = settings.user;
			localStorage.setItem("rguser", settings.user);
		} else { 
			USER = ""; // Set to empty string to blow up future parsing
		}
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

if (USER && USER != "" && USER != "null") {
	updStatus(`Railgun ${VERSION} loaded\nCurrent user: ${USER}\nApplications available: ${MAGAZINE.length}\nAwaiting command`);
} else { 
	failStatus("User could not be pulled from settings.\nAdditional setup is likely required");
	lockSimul();
	// chrome.runtime.openOptionsPage();
}

makeCenter.appendChild(statusText);
statusBox.appendChild(makeCenter);

document.body.appendChild(statusBox);

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

// Convenient wrapper around POST requests that attaches user agent, userclick, and handles simultaneity
function makeRequest(userclick, url, payload, successMessage) { 
	// Debugging: make sure user identifiers are available and correct
	console.debug(USER_AGENT);
	console.debug(USER_URL);

	// No user agent! Refuse to create/send the request.
	if (!(USER && USER != "" && USER != "null") || !(USER_AGENT && USER_AGENT != "" && USER_AGENT != "null")) {
		lockSimul();
		failStatus("Cannot make web requests until user agent is set!");
		return;
	}

	// Lock simultaneity items
	lockSimul()

	const xhr = new XMLHttpRequest();

	// Attach userclick and user-agent to URL
	xhr.open("POST", `${url}/template-overall=none/?script=${USER_URL}&userclick=${userclick}`);
	xhr.setRequestHeader("User-Agent", USER_AGENT); // Additionally attach user-agent to request if possible

	// Deliver URL-Encoded form data, like NS site normally does
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

	// Only allow unlock once the request is done and responded to
	xhr.onload = () => { 
		if (xhr.readyState === XMLHttpRequest.DONE) { 
			successStatus(successMessage);
			// Finished request, unlock simultaneity
			unlockSimul();
		}
	};

	// Fire off web request
	xhr.send(payload)

}

// Where the magic happens
document.addEventListener('keyup', function(event) { 
	if (USER == "") { 
		failStatus("Cannot perform activity without user ID. Edit settings and refresh.");
		lockSimul();
		return;
	} else if (event.shiftKey || event.ctrlKey || event.altKey || document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA') { // locks you out of the script while you're holding down a modifier key or typing in an input
		return;
	} else {
		// Extra safeguard - if simultaneity in effect, drop any keybinds
		if (window.simulLocked) { 
			warnStatus("Cannot process, simultaneity in effect!");
			return;
		}

		let USERCLICK = Date.now();
		switch (event.code) { // event.code is the key that was pressed
			// Clear magazine
			case 'KeyM':
				// let MAGAZINE = JSON.parse(localStorage.getItem("rgmagazine")) || []
				if (window.confirm("Are you sure you want to clear your magazine?")) { 
					MAGAZINE = [];
					localStorage.setItem("rgmagazine", JSON.stringify(MAGAZINE));
					successStatus("Cleared magazine");
				}
				break;

			// Add application to magazine
			case 'KeyL':
				if (!document.location.href.includes("join_WA")) {
					failStatus("Cannot load applications if not on application page");
				} else { 
					let MAGAZINE = JSON.parse(localStorage.getItem("rgmagazine"));

					let appid = document.getElementsByName("appid")[0].value;
					let appnation = document.getElementsByClassName("button primary icon approve big")[0].form.children.nation.value;
					let foundApplication = false;
					for (i=0; i<MAGAZINE.length;i++) { 
						if (MAGAZINE[i]["appid"] == appid) { 
							failStatus("Application already in magazine");
							foundApplication = true;
							break;
						}
					}

					if (!foundApplication) { 
						MAGAZINE.push({"nation": appnation, "appid": appid});
						localStorage.setItem("rgmagazine", JSON.stringify(MAGAZINE));
						successStatus(`Added ${appnation} to magazine\nCurrent magazine length: ${MAGAZINE.length}`);
					}
				}
				break;

			// Join WA
			case 'KeyR': 
				if (MAGAZINE.length == 0) { 
					failStatus("No applications left in magazine!");
				} else { 
					// Remove application from stack in memory and flash updated list to system
					// Use SHIFT for FIFO feeding - just load tabs in the order desired
					let next_up = MAGAZINE.shift()
					localStorage.setItem("rgmagazine", JSON.stringify(MAGAZINE));

					let nation = next_up["nation"]
					let appid = next_up["appid"]
					updStatus(`Joining the World Assembly with ${nation}`);

					localStorage.setItem("rgnation", nation); // Current nation
					localStorage.setItem("rgchk", ""); // Clear out auth values
					localStorage.setItem("rglocalid", "");
					// Copy to clipboard
					navigator.clipboard.writeText(`https://www.nationstates.net/nation=${nation}`); 

					makeRequest(USERCLICK, "/cgi-bin/join_un.cgi", `nation=${nation}&appid=${appid}`, `Joined the World Assembly with ${nation}`);
				}
				break;

			// Resign WA
			case 'KeyE': 
				updStatus("Resigning from the World Assembly");
				if (!chk) { 
					failStatus("Could not fetch chk value");
					// document.location.href = "https://www.nationstates.net/page=un/template-overall=none";
				}

				makeRequest(
					USERCLICK, 
					"/page=UN_status", 
					`action=leave_UN&chk=${chk}&submit=1`, 
					"Resigned from the World Assembly"
				);

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
				updStatus(`ROing in ${region}`);
				
				let RO_name = rotitle;
				// Tagging RO options
				makeRequest(
					USERCLICK, 
					`region=${region}`, 
					`page=region_control&region=${region}&chk=${chk}&nation=${nation}&office_name=${RO_name}&authority_A=on&authority_C=on&authority_E=on&authority_P=on&editofficer=1`, 
					`RO'd in ${region} successfully`
				);

				break;

			case 'KeyF':
				if (document.location.href.includes("region=")) { 
					if (!region) {
						warnStatus("Cannot move to region you are already in");
						break;
					}

					updStatus(`Moving to region ${region}`);

					makeRequest(
						USERCLICK,
						"/page=change_region",
						`localid=${localid}&region_name=${region}&move_region=1`, 
						`Moved to ${region} successfully`
					);

					break;

				} else { 
					warnStatus("Not looking at region");
				}

				break;

			// Endorse a nation
			case 'KeyS':
				if (!document.location.href.includes("nation=")) { 
					warnStatus("Must be on a nation page to endorse");
				} else { 
					let targetnation = document.getElementsByClassName("endorse")[0].form.children.nation.value ;
					makeRequest(USERCLICK, "/cgi-bin/endorse.cgi", `nation=${targetnation}&localid=${localid}&action=endorse`, `Endorsed ${targetnation}`);
				}

				break;
		}
	}
});
