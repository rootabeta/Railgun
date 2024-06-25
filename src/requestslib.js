// Force submit buttons to enforce simultaneity once clicked
// This submits the parent form, but only if the button is clicked
// If the button is disabled, onclick never triggers and the submission never occurs
function prepareButtons() { 
	let allButtons = document.querySelectorAll('button[type=submit]');
	for (i=0;i<allButtons.length;i++) { 
		allButtons[i].setAttribute("onclick", "$('form input[type=\"submit\"], form button').attr(\"disabled\", true).addClass(\"disabledForSimultaneity\");");
	}
}

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

function buildCache(current_region) { 
	// No user agent! Refuse to create/send the request.
	if (!(USER && USER != "" && USER != "null")) {
			failStatus("Cannot make web requests until user agent is set!");
			return;
	}

	console.log(`Building cache for ${current_region} with ${USER_AGENT}`);

	var headers = {};
	fetch(`https://www.nationstates.net/cgi-bin/api.cgi?script=${USER_URL}&region=${current_region}&q=officers+banlist`, {
		headers: { 
			"User-Agent": USER_AGENT,
		},
	}).then((response) => {
		headers = response.headers;
		return response.text()
	}).then((body) => { 
		var parser = new DOMParser();

		var responseDocument = parser.parseFromString(body, "text/xml");
		let officers = responseDocument.querySelector("OFFICERS").children;
		var banlist = responseDocument.querySelector("BANNED").textContent;

		// Empty banlist
		if (!banlist) { 
			banlist = [];
		} else { 
			// Split on nation names
			banlist = banlist.split(":");
		}

		if (banlist.includes(nation)) { 
			failStatus(`${nation} is banned from ${current_region}`);
		}

		// Found our own nation as an RO with PACE perms
		var found_self = false;
		var parsed_officers = [];
		for (var i=0; i<officers.length; i++) { 
			let officer = officers[i];

			let officer_nation = officer.querySelector("NATION").textContent;
			let officer_authority = officer.querySelector("AUTHORITY").textContent;
			let officer_office = officer.querySelector("OFFICE").textContent;
			let officer_by = officer.querySelector("BY").textContent;
			let officer_permissions = {
				"successor": officer_authority.includes("S"),
				"border_control": officer_authority.includes("B"),
				"appearance": officer_authority.includes("A"),
				"communications": officer_authority.includes("C"),
				"embassies": officer_authority.includes("E"),
				"polls": officer_authority.includes("P"),
				"executive": officer_authority.includes("X"), // I hope to god this is never true
			};

			// Should we dismiss/rename/etc?
			var should_tamper = true;
			
			// This is us! We are an RO here already!
			if (officer_nation == nation) { 
				if (
					officer_permissions["appearance"] &&
					officer_permissions["communications"] && 
					officer_permissions["embassies"] &&
					officer_permissions["polls"] 
				) 
				{
					found_self = true;
					should_tamper = false;
				}
			}

			// We have already tampered with this particular nation
			if (officer_by == nation) {
				should_tamper = false;
			}

			let parsed_officer = {
				"nation": officer_nation,
				"office": officer_office,
				"permissions": officer_permissions,
				"tamper": should_tamper,
			}

			// Add the officer item to the list
			// We actually only care about the ones we should tamper with
			// This way, we can just pop them all off the list
			if (parsed_officer["tamper"]) { 
				parsed_officers.push(parsed_officer);
			}
		};

		// We store if we are out of requests, and when the bucket will reset
		// This way, if our cache is empty, we can check if we have requests left
		// If we don't, we know how long to wait for.
		let cache = {
			"region_name": current_region,
			"banlist": banlist,
			"cache_built": Date.now(),
			"bucket_empty": (headers.get("ratelimit-remaining") == "0"),
			"bucket_reset": (Date.now() + (parseInt(headers.get("ratelimit-reset")) * 1000)),
			"already_ro": found_self,
			"officers": parsed_officers,
			"total_officers": officers.length,
		};

		console.log("Built cache successfully");
		console.log(cache);

		localStorage.setItem("rgregioncache", JSON.stringify(cache));
	});
}

// Convenient wrapper around POST requests that attaches user agent, userclick, and handles simultaneity
function makeRequest(url, payload, handlerCallback) { 
	// Exact timestamp the request was invoked by the user
	// We go here immediately after agreeing to launch a request
	let USERCLICK = Date.now();
	var success = false;

	function failed_response(error) {
		failStatus("Request timed out");
		unlockSimul();
	}

	// No user agent! Refuse to create/send the request.
	if (!(USER && USER != "" && USER != "null")) {
			failStatus("Cannot make web requests until user agent is set!");
			return;
	}

	// If we are already in simul, refuse to honor the request
	// Otherwise, engage simultaneity and prepare to go warp speed
	if (window.simulLocked) { 
		failStatus("Tried to run request during simultaneity");
		return;
	} else { 
		// Lock simultaneity items
		lockSimul()
	}

	// Debugging: make sure user identifiers are available and correct
	console.debug(USER_AGENT);
	console.debug(USER_URL);

	return fetch(`${url}/template-overall=none/?script=${USER_URL}&userclick=${USERCLICK}`, { 
		method: "POST",
		redirect: "follow", // https://forum.nationstates.net/viewtopic.php?p=41718911#p41718911
		signal: AbortSignal.timeout(30_000), // A signal to timeout after 30s if no response has come back
		headers: { 
			"User-Agent": USER_AGENT, // Set user agent for identification
			"Content-Type": "application/x-www-form-urlencoded",
			"Accept": "text/html"
		},
		body: payload,
	})
	.then((response) => response.text())
	.then((text) => { 
		unlockSimul(); // Now that we have a response, unlock simultaneity

		// Parse the response into an HTML document - easier to work with
		var parser = new DOMParser();
		var responseDocument = parser.parseFromString(text, "text/html");

		// Pull chk and localid from page in all cases, just in case we can get refreshed values
		if (responseDocument.getElementsByName("chk").length > 0) { 
			localStorage.setItem("rgchk", responseDocument.getElementsByName("chk")[0].value); 
		}
		if (responseDocument.getElementsByName("localid").length > 0) { 
			localStorage.setItem("rglocalid", responseDocument.getElementsByName("localid")[0].value);
		}

		// Pass the resulting document to the callback for it to handle
		return handlerCallback(responseDocument);
	});
}
