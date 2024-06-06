// Get version of Railgun, for crafting requests
let VERSION = chrome.runtime.getManifest().version;

// Default values
let USER = localStorage.getItem("rguser");
let rotitle = localStorage.getItem("rgrotitle") || "Railgun";
let suctitle = localStorage.getItem("rgsuctitle") || "Task Failed Successorly";
let govtitle = localStorage.getItem("rggovtitle") || "Maintain A";
let JUMP_POINT = localStorage.getItem("rgjumppoint") || "suspicious";
let MAGAZINE = JSON.parse(localStorage.getItem("rgmagazine")) || []

// Load settings
const getting = chrome.storage.sync.get();
getting.then(loadSettings, settingsFailed);

// Identification strings
let USER_AGENT = `Railgun/${VERSION} (By: Volstrostia; usedBy: ${USER})`;
let USER_URL = `Railgun_${VERSION}_by_Volstrostia_usedBy_${USER}`; // For chrome

// Prepare buttons for simultaneity
prepareButtons();

// Each time the main page loads, gather important values from it
var localid = some("localid") || localStorage.getItem("rglocalid");
var chk = some("chk") || localStorage.getItem("rgchk");

// Gather current nation
var nationlinks = document.getElementsByClassName("bellink");
if (nationlinks.length > 0) { 
	var nation = nationlinks[0].href.split("=")[1];
} else { 
	var nation = localStorage.getItem("rgnation");
}

// Gather current region. Panel value is later overwritten during move. 
var regionpanel = grab("panelregionbar");
if (regionpanel) { 
	var region = regionpanel.children[0].href.split("=")[1];
	console.log(`Got region from panel ${region}`);
} else { 
	console.log("Could not get panel");
	var region = localStorage.getItem("rgregion");
}

// Write back freshest values into local cache
localStorage.setItem("rglocalid", localid);
localStorage.setItem("rgchk", chk); // Useful for stuff like resignation
localStorage.setItem("rgnation", nation); // Current nation
localStorage.setItem("rgregion", region); // Current region

console.debug(`LocalID: ${localid} | chk: ${chk}`);

// Ensure user values are present, and lock out if not
if (USER && USER != "" && USER != "null") {
	updStatus(`Railgun ${VERSION} loaded\nCurrent user: ${USER}\nApplications available: ${MAGAZINE.length}\nCurrent nation: ${nation}\nCurrent region: ${region}\nAwaiting command`);
} else { 
	failStatus("User could not be pulled from settings.\nAdditional setup is likely required");
	lockSimul();
}

// Keyboard event listener
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
				if (window.confirm("Are you sure you want to clear your magazine?")) { 
					MAGAZINE = [];
					localStorage.setItem("rgmagazine", JSON.stringify(MAGAZINE));
					successStatus("Cleared magazine");
				}
				break;

			// Add application to magazine
			case 'KeyL':
				// Catch freshest values
				MAGAZINE = JSON.parse(localStorage.getItem("rgmagazine")) || []
				if (!document.location.href.includes("join_WA")) {
					failStatus("Cannot load applications if not on application page");
				} else { 
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

					let appnation = next_up["nation"]
					let appid = next_up["appid"]
					updStatus(`Joining the World Assembly with ${appnation}`);

					makeRequest(
						USERCLICK, 
						"/cgi-bin/join_un.cgi", 
						`nation=${appnation}&appid=${appid}`, 
						joinCallback
					);
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
					resignCallback
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
					ROCallback
				);

				break;

			case 'KeyF':
				if (document.location.href.includes("region=")) { 
					var targetRegion = document.location.href.split("region=")[1];

					if (!region) {
						warnStatus("Cannot move to region you are already in");
						break;
					}


					updStatus(`Moving to region ${targetRegion}`);

					makeRequest(
						USERCLICK,
						"/page=change_region",
						`localid=${localid}&region_name=${targetRegion}&move_region=1`, 
						moveCallback
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
					makeRequest(
						USERCLICK, 
						"/cgi-bin/endorse.cgi", 
						`nation=${targetnation}&localid=${localid}&action=endorse`, 
						endorseCallback
					);
				}

				break;
		}
	}
});
